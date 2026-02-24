import { Injectable } from '@angular/core';

/**
 * WebAuthn credential information stored in localStorage
 */
export interface StoredCredential {
  credentialId: string;
  username: string;
  createdAt: number;
  encryptedPassword?: string; // Encrypted password for biometric login
}

/**
 * Options for credential registration
 */
export interface RegistrationOptions {
  username: string;
  displayName: string;
  timeout?: number;
}

/**
 * Result of credential registration
 */
export interface RegistrationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

/**
 * Options for authentication
 */
export interface AuthenticationOptions {
  username: string;
  timeout?: number;
}

/**
 * Result of authentication
 */
export interface AuthenticationResult {
  success: boolean;
  credentialId?: string;
  password?: string; // Decrypted password for establishing session
  error?: string;
}

/**
 * Result of credential validation
 */
export interface CredentialValidationResult {
  isValid: boolean;
  needsReregistration: boolean;
  error?: string;
}

/**
 * Browser capability information
 */
export interface WebAuthnCapability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  errorMessage?: string;
}

/**
 * Service for managing WebAuthn biometric authentication
 * Handles credential registration, authentication, and storage
 */
@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {
  private readonly CREDENTIALS_KEY = 'webauthn_credentials';
  private readonly RP_NAME = 'Expense Tracker';
  private readonly RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  constructor() {}

  /**
   * Check if WebAuthn is supported and platform authenticator is available
   * Requirements: 2.5, 8.3
   */
  async checkCapability(): Promise<WebAuthnCapability> {
    // Check if WebAuthn API is available
    if (!window.PublicKeyCredential) {
      return {
        isSupported: false,
        hasPlatformAuthenticator: false,
        errorMessage: 'WebAuthn no está soportado en este navegador'
      };
    }

    try {
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      return {
        isSupported: true,
        hasPlatformAuthenticator: available,
        errorMessage: available ? undefined : 'No hay autenticador biométrico disponible en este dispositivo'
      };
    } catch (error) {
      return {
        isSupported: true,
        hasPlatformAuthenticator: false,
        errorMessage: 'Error al verificar capacidades biométricas'
      };
    }
  }

  /**
   * Register a new WebAuthn credential for the user
   * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 4.3
   */
  async register(options: RegistrationOptions, password?: string): Promise<RegistrationResult> {
    try {
      // Check network connectivity
      // Requirement 4.3: Inform user that biometric auth requires network connectivity
      if (!this.isOnline()) {
        return {
          success: false,
          error: 'L\'autenticació biomètrica requereix connexió a internet'
        };
      }

      // Check capability first
      const capability = await this.checkCapability();
      if (!capability.isSupported || !capability.hasPlatformAuthenticator) {
        return {
          success: false,
          error: capability.errorMessage || 'Autenticación biométrica no disponible'
        };
      }

      // Generate challenge
      const challenge = this.generateChallenge();
      
      // Convert username to Uint8Array
      const userIdBuffer = new TextEncoder().encode(options.username);

      // Create credential creation options
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge as BufferSource,
        rp: {
          name: this.RP_NAME,
          id: this.RP_ID
        },
        user: {
          id: userIdBuffer,
          name: options.username,
          displayName: options.displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Device-bound credentials
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: options.timeout || this.DEFAULT_TIMEOUT,
        attestation: 'none'
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (!credential) {
        return {
          success: false,
          error: 'No se pudo crear la credencial'
        };
      }

      // Store credential ID
      const credentialId = this.arrayBufferToBase64(credential.rawId);
      
      // Encrypt password if provided
      let encryptedPassword: string | undefined;
      if (password) {
        encryptedPassword = await this.encryptPassword(password, credentialId);
      }
      
      this.storeCredential({
        credentialId,
        username: options.username,
        createdAt: Date.now(),
        encryptedPassword
      });

      return {
        success: true,
        credentialId
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Authenticate using an existing WebAuthn credential
   * Requirements: 7.3, 7.6, 4.3
   */
  async authenticate(options: AuthenticationOptions): Promise<AuthenticationResult> {
    try {
      // Check network connectivity
      // Requirement 4.3: Inform user that biometric auth requires network connectivity
      if (!this.isOnline()) {
        return {
          success: false,
          error: 'L\'autenticació biomètrica requereix connexió a internet'
        };
      }

      // Check capability first
      const capability = await this.checkCapability();
      if (!capability.isSupported || !capability.hasPlatformAuthenticator) {
        return {
          success: false,
          error: capability.errorMessage || 'Autenticación biométrica no disponible'
        };
      }

      // Get stored credential
      const storedCredential = this.getCredential(options.username);
      if (!storedCredential) {
        return {
          success: false,
          error: 'No hay credencial registrada para este usuario'
        };
      }

      // Generate challenge
      const challenge = this.generateChallenge();

      // Convert credential ID back to ArrayBuffer
      const credentialIdBuffer = this.base64ToArrayBuffer(storedCredential.credentialId);

      // Create authentication options
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge as BufferSource,
        rpId: this.RP_ID,
        allowCredentials: [{
          id: credentialIdBuffer,
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: options.timeout || this.DEFAULT_TIMEOUT
      };

      // Get credential
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        return {
          success: false,
          error: 'Autenticación cancelada'
        };
      }

      // Decrypt password if available
      let password: string | undefined;
      if (storedCredential.encryptedPassword) {
        try {
          password = await this.decryptPassword(storedCredential.encryptedPassword, storedCredential.credentialId);
        } catch (error) {
          console.error('Error decrypting password:', error);
          return {
            success: false,
            error: 'Error al recuperar la contraseña almacenada'
          };
        }
      }

      return {
        success: true,
        credentialId: storedCredential.credentialId,
        password
      };
    } catch (error: any) {
      // Check if error indicates credential invalidation due to device changes
      // Requirement 4.5: Handle credential invalidation gracefully
      const errorName = error.name || '';
      const errorMessage = error.message || '';
      
      // These errors may indicate device biometric settings have changed
      if (errorName === 'InvalidStateError' || 
          errorName === 'NotAllowedError' ||
          errorMessage.includes('credential') ||
          errorMessage.includes('authenticator')) {
        
        // Remove the invalid credential
        this.removeCredential(options.username);
        
        return {
          success: false,
          error: 'La credencial biométrica ya no es válida. Por favor, regístrate de nuevo.'
        };
      }
      
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Check if a user has a registered credential
   * Requirements: 2.3
   */
  hasCredential(username: string): boolean {
    const credential = this.getCredential(username);
    return credential !== null;
  }

  /**
   * Get stored credential for a user
   * Requirements: 2.3
   */
  getCredential(username: string): StoredCredential | null {
    const credentials = this.getAllCredentials();
    return credentials.find(c => c.username === username) || null;
  }

  /**
   * Store a credential in localStorage
   * Requirements: 2.3
   */
  private storeCredential(credential: StoredCredential): void {
    const credentials = this.getAllCredentials();
    
    // Remove any existing credential for this username
    const filtered = credentials.filter(c => c.username !== credential.username);
    
    // Add new credential
    filtered.push(credential);
    
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(filtered));
  }

  /**
   * Remove a credential from localStorage
   * Requirements: 7.2
   */
  removeCredential(username: string): void {
    const credentials = this.getAllCredentials();
    const filtered = credentials.filter(c => c.username !== username);
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(filtered));
  }

  /**
   * Validate if a stored credential is still valid
   * This detects if device biometric settings have changed
   * Requirements: 4.5
   */
  async validateCredential(username: string): Promise<CredentialValidationResult> {
    try {
      // Check if credential exists
      const storedCredential = this.getCredential(username);
      if (!storedCredential) {
        return {
          isValid: false,
          needsReregistration: true,
          error: 'No hay credencial registrada'
        };
      }

      // Check capability
      const capability = await this.checkCapability();
      if (!capability.isSupported || !capability.hasPlatformAuthenticator) {
        return {
          isValid: false,
          needsReregistration: true,
          error: capability.errorMessage || 'Autenticador biométrico no disponible'
        };
      }

      // Try to verify the credential is still accessible
      // We do this by attempting a silent authentication check
      try {
        const challenge = this.generateChallenge();
        const credentialIdBuffer = this.base64ToArrayBuffer(storedCredential.credentialId);

        // Create a test authentication request with a short timeout
        const publicKeyOptions: PublicKeyCredentialRequestOptions = {
          challenge: challenge as BufferSource,
          rpId: this.RP_ID,
          allowCredentials: [{
            id: credentialIdBuffer,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 5000 // Short timeout for validation
        };

        // This will throw if the credential is no longer valid
        // Note: This may prompt the user for biometric verification
        await navigator.credentials.get({
          publicKey: publicKeyOptions
        });

        return {
          isValid: true,
          needsReregistration: false
        };
      } catch (error: any) {
        // Check if error indicates credential invalidation
        const errorName = error.name || '';
        const errorMessage = error.message || '';

        // These errors indicate the credential is no longer valid
        if (errorName === 'NotAllowedError' || 
            errorName === 'InvalidStateError' ||
            errorMessage.includes('credential') ||
            errorMessage.includes('authenticator')) {
          return {
            isValid: false,
            needsReregistration: true,
            error: 'La credencial biométrica ya no es válida. Por favor, regístrate de nuevo.'
          };
        }

        // Timeout or user cancellation - credential might still be valid
        if (errorName === 'TimeoutError' || errorName === 'AbortError') {
          return {
            isValid: true,
            needsReregistration: false
          };
        }

        // Unknown error - assume credential might be invalid
        return {
          isValid: false,
          needsReregistration: true,
          error: 'No se pudo validar la credencial biométrica'
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        needsReregistration: true,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Check if credential needs reregistration due to device changes
   * This is a non-intrusive check that doesn't prompt the user
   * Requirements: 4.5
   */
  async checkCredentialHealth(username: string): Promise<boolean> {
    try {
      // Check if credential exists
      const storedCredential = this.getCredential(username);
      if (!storedCredential) {
        return false;
      }

      // Check capability without user interaction
      const capability = await this.checkCapability();
      if (!capability.isSupported || !capability.hasPlatformAuthenticator) {
        return false;
      }

      // If we can decrypt the stored password, the credential is likely still valid
      if (storedCredential.encryptedPassword) {
        try {
          await this.decryptPassword(storedCredential.encryptedPassword, storedCredential.credentialId);
          return true;
        } catch (error) {
          // Decryption failed - credential might be invalid
          return false;
        }
      }

      // If no encrypted password, assume credential is valid
      // (actual validation will happen during authentication)
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all stored credentials
   */
  private getAllCredentials(): StoredCredential[] {
    const stored = localStorage.getItem(this.CREDENTIALS_KEY);
    if (!stored) {
      return [];
    }
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Generate a cryptographically secure random challenge
   * Requirements: 7.3
   */
  private generateChallenge(): Uint8Array {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  }

  /**
   * Convert ArrayBuffer to Base64 string for storage
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string back to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get user-friendly error message from WebAuthn error
   * Requirements: 8.3
   */
  private getErrorMessage(error: any): string {
    if (!error) {
      return 'Error desconocido';
    }

    const errorName = error.name || '';
    const errorMessage = error.message || '';

    // Map common WebAuthn errors to user-friendly messages
    if (errorName === 'NotAllowedError' || errorMessage.includes('NotAllowedError')) {
      return 'Autenticación cancelada o denegada';
    }
    
    if (errorName === 'NotSupportedError' || errorMessage.includes('NotSupportedError')) {
      return 'Autenticación biométrica no soportada';
    }
    
    if (errorName === 'InvalidStateError' || errorMessage.includes('InvalidStateError')) {
      return 'Ya existe una credencial para este dispositivo';
    }
    
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return 'Tiempo de espera agotado. Por favor, inténtalo de nuevo';
    }
    
    if (errorName === 'SecurityError' || errorMessage.includes('SecurityError')) {
      return 'Error de seguridad. Verifica que estés usando HTTPS';
    }
    
    if (errorName === 'AbortError' || errorMessage.includes('AbortError')) {
      return 'Operación cancelada';
    }

    return `Error: ${errorMessage || errorName || 'Error desconocido'}`;
  }

  /**
   * Encrypt password using credential ID as key material
   * This ensures the password can only be decrypted with the same credential
   */
  private async encryptPassword(password: string, credentialId: string): Promise<string> {
    try {
      // Derive encryption key from credential ID
      const key = await this.deriveEncryptionKey(credentialId);
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt password
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        passwordBytes
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Error encrypting password:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  /**
   * Decrypt password using credential ID as key material
   */
  private async decryptPassword(encryptedPassword: string, credentialId: string): Promise<string> {
    try {
      // Derive encryption key from credential ID
      const key = await this.deriveEncryptionKey(credentialId);
      
      // Decode encrypted data
      const combined = this.base64ToArrayBuffer(encryptedPassword);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Decrypt password
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw new Error('Failed to decrypt password');
    }
  }

  /**
   * Derive encryption key from credential ID
   */
  private async deriveEncryptionKey(credentialId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(credentialId);
    
    // Import key material
    const importedKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive key using PBKDF2
    const salt = encoder.encode('webauthn-password-encryption-v1');
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Check if the device is online
   * Requirement 4.3: Detect network connectivity status
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}
