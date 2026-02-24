import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { WebAuthnService } from '../../services/webauthn.service';
import { BiometricPromptDialogComponent } from '../biometric-prompt-dialog/biometric-prompt-dialog';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  showBiometricButton: boolean = false;
  biometricLoading: boolean = false;
  isOffline: boolean = false;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly webAuthnService = inject(WebAuthnService);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['user'], // Not used, but kept for compatibility
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Check if biometric login is available
    // Requirement 3.1: Display biometric login option when credentials exist
    this.checkBiometricAvailability();
    
    // Monitor online/offline status
    // Requirement 4.3: Detect network connectivity status
    this.setupConnectivityMonitoring();
  }

  /**
   * Check if biometric login should be shown
   * Requirements: 3.1, 4.5
   */
  private async checkBiometricAvailability(): Promise<void> {
    try {
      const username = 'user'; // Default username
      
      // Check if user has registered credentials
      if (this.webAuthnService.hasCredential(username)) {
        // Check device capability
        const capability = await this.webAuthnService.checkCapability();
        
        if (capability.isSupported && capability.hasPlatformAuthenticator) {
          // Requirement 4.5: Check credential health to detect device biometric setting changes
          const isHealthy = await this.webAuthnService.checkCredentialHealth(username);
          
          if (isHealthy) {
            this.showBiometricButton = true;
          } else {
            // Credential is no longer valid - remove it and hide button
            this.webAuthnService.removeCredential(username);
            this.showBiometricButton = false;
            console.warn('Biometric credential is no longer valid and has been removed');
          }
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      this.showBiometricButton = false;
    }
  }

  /**
   * Setup connectivity monitoring for offline detection
   * Requirement 4.3: Detect network connectivity status
   */
  private setupConnectivityMonitoring(): void {
    // Check initial status
    this.isOffline = !navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      // Clear offline-related error messages
      if (this.errorMessage.includes('connexió a internet')) {
        this.errorMessage = '';
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOffline = true;
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (success) => {
          if (success) {
            // Load settings after successful login
            this.settingsService.loadSettings().subscribe({
              next: () => {
                // Check if we should show biometric prompt
                this.checkAndShowBiometricPrompt();
              },
              error: (error) => {
                console.error('Error loading settings after login:', error);
                // Still check for biometric prompt, settings will use defaults
                this.checkAndShowBiometricPrompt();
              }
            });
          } else {
            this.errorMessage = "Clau d'encriptació invàlida (mínim 8 caràcters)";
            this.loginForm.patchValue({ password: '' });
          }
        },
        error: () => {
          this.errorMessage = "S'ha produït un error durant l'inici de sessió";
        }
      });
    }
  }

  /**
   * Check WebAuthn support and show biometric prompt if appropriate
   * Requirements: 1.1, 1.4, 1.5, 2.1
   */
  private async checkAndShowBiometricPrompt(): Promise<void> {
    try {
      // Get username from form (using 'user' as default)
      const username = this.loginForm.value.username || 'user';

      // Check if user already has registered credentials
      // Requirement 1.5: Don't show prompt if already registered
      if (this.webAuthnService.hasCredential(username)) {
        this.navigateToDashboard();
        return;
      }

      // Check device capability
      // Requirement 1.4: Only show if device supports WebAuthn and biometrics
      const capability = await this.webAuthnService.checkCapability();
      
      if (!capability.isSupported || !capability.hasPlatformAuthenticator) {
        // Device doesn't support biometric authentication
        this.navigateToDashboard();
        return;
      }

      // Show biometric prompt dialog
      // Requirement 1.1: Display dialog asking if user wants to enable biometric auth
      this.showBiometricPrompt(username);
    } catch (error) {
      console.error('Error checking biometric capability:', error);
      // On error, just navigate to dashboard
      this.navigateToDashboard();
    }
  }

  /**
   * Show the biometric enrollment prompt dialog
   * Requirements: 1.1, 1.2, 1.3
   */
  private showBiometricPrompt(username: string): void {
    const dialogRef = this.dialog.open(BiometricPromptDialogComponent, {
      width: '400px',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((accepted: boolean) => {
      if (accepted) {
        // Requirement 1.2: User accepted - initiate credential registration
        // Note: Actual registration will be implemented in Task 3.2
        this.initiateBiometricRegistration(username);
      } else {
        // Requirement 1.3: User declined - complete authentication normally
        this.navigateToDashboard();
      }
    });
  }

  /**
   * Initiate biometric credential registration
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.4
   */
  private async initiateBiometricRegistration(username: string): Promise<void> {
    try {
      // Get the password from the login form
      const password = this.loginForm.value.password;
      
      if (!password) {
        this.showRegistrationError('No se pudo obtener la contraseña', username);
        return;
      }
      
      // Call WebAuthn service register() method with password
      // Requirement 2.1: Initiate credential registration process
      // Requirement 2.2: Create credential associated with user account identifier
      // Requirement 2.5: Use platform authenticator attachment for device-bound credentials
      const result = await this.webAuthnService.register({
        username: username,
        displayName: username,
        timeout: 30000 // 30 seconds timeout
      }, password); // Pass password for secure storage

      if (result.success) {
        // Requirement 2.3: Credential ID is stored in localStorage by WebAuthnService
        // Requirement 2.6: Display success confirmation message
        this.showSuccessMessage('Autenticació biomètrica activada correctament');
        this.navigateToDashboard();
      } else {
        // Requirement 2.4: Display error message and allow retry or skip
        // Requirement 8.4: Handle registration errors with retry option
        this.showRegistrationError(result.error || 'Error desconocido', username);
      }
    } catch (error) {
      console.error('Unexpected error during biometric registration:', error);
      // Requirement 2.4: Handle unexpected errors with retry option
      this.showRegistrationError('Error inesperat durant el registre', username);
    }
  }

  /**
   * Show success message to user
   * Requirement 2.6
   */
  private showSuccessMessage(message: string): void {
    // For now, use console.log. In a production app, this would use a snackbar or toast
    console.log('SUCCESS:', message);
    // TODO: Implement proper UI notification (e.g., MatSnackBar)
  }

  /**
   * Show registration error with retry option
   * Requirements: 2.4, 8.4
   */
  private showRegistrationError(errorMessage: string, username: string): void {
    // Display error message
    console.error('Registration error:', errorMessage);
    
    // For now, show a simple confirm dialog for retry
    // In production, this would use a proper Material Dialog
    const retry = confirm(`Error en el registre biomètric: ${errorMessage}\n\n¿Vols tornar-ho a intentar?`);
    
    if (retry) {
      // User wants to retry
      this.initiateBiometricRegistration(username);
    } else {
      // User wants to skip
      this.navigateToDashboard();
    }
  }

  /**
   * Navigate to dashboard
   */
  private navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handle biometric login button click
   * Requirements: 3.1, 3.2, 3.3, 3.6, 3.4, 8.1, 8.2
   */
  async onBiometricLogin(): Promise<void> {
    this.biometricLoading = true;
    this.errorMessage = '';
    
    try {
      const username = 'user'; // Default username
      
      // Requirement 3.2: Request authentication using stored credential
      // Requirement 3.6: Handle authentication within 10-second timeout
      const result = await this.webAuthnService.authenticate({
        username: username,
        timeout: 10000 // 10 seconds as per Requirement 3.6
      });

      if (result.success && result.password) {
        // Requirement 3.3: Log user in without requiring password entry
        // Retrieve stored encryption key and authenticate with AuthService
        this.authService.login({
          username: username,
          password: result.password
        }).subscribe({
          next: (success) => {
            if (success) {
              // Load settings after successful login
              this.settingsService.loadSettings().subscribe({
                next: () => {
                  this.navigateToDashboard();
                },
                error: (error) => {
                  console.error('Error loading settings after biometric login:', error);
                  // Still navigate to dashboard, settings will use defaults
                  this.navigateToDashboard();
                }
              });
            } else {
              this.errorMessage = 'Error en l\'autenticació: clau d\'encriptació invàlida';
              this.biometricLoading = false;
            }
          },
          error: (error) => {
            console.error('Error during AuthService login:', error);
            this.errorMessage = 'Error durant l\'inici de sessió';
            this.biometricLoading = false;
          }
        });
      } else if (result.success && !result.password) {
        // Biometric authentication succeeded but no password was stored
        // This can happen if the credential was registered before password storage was implemented
        // Requirement 8.1: Default to password authentication when biometric is unavailable
        this.errorMessage = 'Credencial biomètrica sense contrasenya associada. Si us plau, utilitza l\'inici de sessió amb contrasenya.';
        this.biometricLoading = false;
      } else {
        // Requirement 3.4: Allow retry or fallback to password login
        // Requirement 8.1, 8.2: Handle authenticator locked state and provide fallback
        this.handleBiometricError(result.error || 'Error en l\'autenticació biomètrica');
      }
    } catch (error) {
      console.error('Unexpected error during biometric login:', error);
      this.handleBiometricError('Error inesperat durant l\'autenticació biomètrica');
    }
  }

  /**
   * Handle biometric authentication errors with appropriate messaging
   * Requirements: 3.4, 8.1, 8.2, 4.3, 4.5
   */
  private handleBiometricError(error: string): void {
    this.biometricLoading = false;
    
    // Check for offline error
    // Requirement 4.3: Display informative message when biometric auth attempted offline
    if (error.includes('connexió a internet') || error.includes('network') || error.includes('offline')) {
      this.errorMessage = 'L\'autenticació biomètrica requereix connexió a internet. Si us plau, utilitza la contrasenya per iniciar sessió sense connexió.';
      return;
    }
    
    // Check for credential invalidation due to device biometric setting changes
    // Requirement 4.5: Handle credential invalidation gracefully and prompt user to re-register
    if (error.includes('ya no es válida') || error.includes('no longer valid') || 
        error.includes('regístrate de nuevo') || error.includes('re-register')) {
      this.errorMessage = 'La credencial biomètrica ja no és vàlida (possiblement per canvis en la configuració del dispositiu). Si us plau, utilitza la contrasenya per iniciar sessió i registra de nou l\'autenticació biomètrica.';
      // Hide biometric button since credential is invalid
      this.showBiometricButton = false;
      return;
    }
    
    // Detect authenticator locked state
    // Requirement 8.2: Handle authenticator locked state with appropriate messaging
    if (error.includes('bloqueado') || error.includes('locked') || 
        error.includes('demasiados intentos') || error.includes('too many attempts')) {
      this.errorMessage = 'L\'autenticador biomètric està bloquejat per massa intents fallits. Si us plau, utilitza la contrasenya per iniciar sessió.';
    } else if (error.includes('cancelada') || error.includes('denegada') || 
               error.includes('canceled') || error.includes('denied')) {
      this.errorMessage = 'Autenticació biomètrica cancel·lada. Pots tornar-ho a intentar o utilitzar la contrasenya.';
    } else if (error.includes('timeout') || error.includes('tiempo de espera')) {
      this.errorMessage = 'Temps d\'espera esgotat. Si us plau, torna-ho a intentar o utilitza la contrasenya.';
    } else {
      // Generic error message with fallback guidance
      // Requirement 8.1: Default to password authentication when biometric fails
      this.errorMessage = `${error}. Pots tornar-ho a intentar o utilitzar la contrasenya.`;
    }
  }
}
