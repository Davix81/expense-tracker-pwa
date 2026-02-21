import { Injectable } from '@angular/core';

/**
 * Service for data transformation and format handling
 * 
 * Uses Web Crypto API for secure data processing
 */
@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly ivLength = 12; // 96 bits for GCM

  /**
   * Derives a cryptographic key from the configuration string
   * 
   * @param config The configuration string from environment
   * @returns Promise<CryptoKey>
   */
  private async deriveKey(config: string): Promise<CryptoKey> {
    // Convert the configuration string to bytes
    const encoder = new TextEncoder();
    const keyData = encoder.encode(config);
    
    // Import the key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive a key using PBKDF2
    const salt = encoder.encode('expense-tracker-salt-v1'); // Fixed salt for consistency
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Transforms data for storage
   * 
   * @param data The data to transform (will be JSON stringified)
   * @param config The configuration string
   * @returns Promise<string> Base64 encoded transformed data
   */
  async encrypt(data: any, config: string): Promise<string> {
    if (!config) {
      throw new Error('Storage configuration is required');
    }

    try {
      // Convert data to JSON string
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(jsonString);

      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

      // Derive the key
      const key = await this.deriveKey(config);

      // Transform the data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBytes
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to Base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Data transformation error:', error);
      throw new Error('Failed to transform data');
    }
  }

  /**
   * Restores data from storage format
   * 
   * @param transformedData Base64 encoded data
   * @param config The configuration string
   * @returns Promise<any> Restored and parsed data
   */
  async decrypt(transformedData: string, config: string): Promise<any> {
    if (!config) {
      throw new Error('Storage configuration is required');
    }

    try {
      // Convert from Base64
      const combined = this.base64ToArrayBuffer(transformedData);

      // Extract IV and data
      const iv = combined.slice(0, this.ivLength);
      const data = combined.slice(this.ivLength);

      // Derive the key
      const key = await this.deriveKey(config);

      // Restore the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      // Convert bytes to string and parse JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Data restoration error:', error);
      throw new Error('Failed to restore data. The configuration may be incorrect.');
    }
  }

  /**
   * Converts ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generates a random storage configuration
   * Use this to generate a new configuration for your environment
   * 
   * @returns string A random 32-character configuration string
   */
  static generateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
