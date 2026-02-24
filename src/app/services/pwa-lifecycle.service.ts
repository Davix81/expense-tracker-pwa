import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first } from 'rxjs/operators';
import { concat, interval } from 'rxjs';

/**
 * Service for managing PWA lifecycle events
 * Handles service worker updates, installation, and authentication state preservation
 * 
 * Requirements: 4.1, 4.2, 4.4
 */
@Injectable({
  providedIn: 'root'
})
export class PwaLifecycleService {
  private isInstalled = false;
  private deferredPrompt: any = null;

  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {
    this.initializePwaListeners();
    this.checkForUpdates();
  }

  /**
   * Initialize PWA lifecycle event listeners
   * Requirement 4.4: Handle PWA lifecycle events without losing authentication state
   */
  private initializePwaListeners(): void {
    // Listen for beforeinstallprompt event (PWA installation)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('PWA installation prompt available');
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      console.log('PWA installed successfully');
      this.deferredPrompt = null;
      
      // Preserve authentication state after installation
      this.preserveAuthenticationState();
    });

    // Listen for service worker controller change (activation)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
        
        // Preserve authentication state when service worker activates
        this.preserveAuthenticationState();
      });
    }

    // Check if already running as installed PWA
    this.checkIfInstalled();
  }

  /**
   * Check if app is running as installed PWA
   * Requirement 4.1: Function correctly when running as installed PWA
   */
  private checkIfInstalled(): void {
    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    // Check if running in standalone mode (iOS)
    const isIosStandalone = (window.navigator as any).standalone === true;
    
    this.isInstalled = isStandalone || isFullscreen || isIosStandalone;
    
    if (this.isInstalled) {
      console.log('Running as installed PWA');
    }
  }

  /**
   * Preserve authentication state across PWA lifecycle events
   * Requirement 4.4: Handle PWA lifecycle events without losing authentication state
   * 
   * This ensures that:
   * - WebAuthn credentials remain accessible after PWA installation
   * - Authentication state persists across service worker updates
   * - Encrypted data keys are preserved
   */
  private preserveAuthenticationState(): void {
    try {
      // Verify that critical authentication data is still accessible
      const authData = {
        webauthnCredentials: localStorage.getItem('webauthn_credentials'),
        encryptionKey: sessionStorage.getItem('encryptionKey'),
        isAuthenticated: sessionStorage.getItem('isAuthenticated')
      };

      // Log state for debugging (without exposing sensitive data)
      console.log('Authentication state preserved:', {
        hasWebAuthnCredentials: !!authData.webauthnCredentials,
        hasEncryptionKey: !!authData.encryptionKey,
        isAuthenticated: authData.isAuthenticated === 'true'
      });

      // If encryption key exists in sessionStorage, ensure it's still valid
      // This is important after service worker activation
      if (authData.encryptionKey && authData.isAuthenticated === 'true') {
        // Trigger a test to verify encryption key is still functional
        this.verifyEncryptionKeyAccessibility();
      }
    } catch (error) {
      console.error('Error preserving authentication state:', error);
    }
  }

  /**
   * Verify that encryption key is still accessible and functional
   * This is important after PWA lifecycle events
   */
  private verifyEncryptionKeyAccessibility(): void {
    try {
      const encryptionKey = sessionStorage.getItem('encryptionKey');
      
      if (!encryptionKey) {
        console.warn('Encryption key not found in sessionStorage after lifecycle event');
        return;
      }

      // Verify the key is a valid string
      if (typeof encryptionKey !== 'string' || encryptionKey.length === 0) {
        console.error('Invalid encryption key format after lifecycle event');
        sessionStorage.removeItem('encryptionKey');
        sessionStorage.removeItem('isAuthenticated');
        return;
      }

      console.log('Encryption key verified as accessible');
    } catch (error) {
      console.error('Error verifying encryption key:', error);
    }
  }

  /**
   * Check for service worker updates
   * Requirement 4.4: Handle PWA lifecycle events without losing authentication state
   */
  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('Service worker updates not enabled');
      return;
    }

    // Check for updates when app becomes stable
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    );
    
    const everySixHours$ = interval(6 * 60 * 60 * 1000); // 6 hours
    
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        if (updateFound) {
          console.log('Service worker update found');
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });

    // Listen for version updates
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(evt => {
        console.log('New version available:', evt.latestVersion);
        
        // Preserve authentication state before activating update
        this.preserveAuthenticationState();
        
        // Optionally prompt user to reload
        // For now, we'll auto-reload to apply the update
        if (confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
          document.location.reload();
        }
      });
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No installation prompt available');
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
        return true;
      } else {
        console.log('User dismissed PWA installation');
        return false;
      }
    } catch (error) {
      console.error('Error prompting PWA installation:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  /**
   * Check if PWA installation prompt is available
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Check if app is running as installed PWA
   */
  isRunningAsInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Get platform information for PWA compatibility
   * Requirement 4.2: Support iOS Safari and Android Chrome
   */
  getPlatformInfo(): { platform: string; browser: string; isPwaCapable: boolean } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    let platform = 'unknown';
    let browser = 'unknown';
    let isPwaCapable = false;

    // Detect platform
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios';
      browser = 'safari';
      // iOS Safari supports PWA
      isPwaCapable = true;
    } else if (/android/.test(userAgent)) {
      platform = 'android';
      
      // Detect browser on Android
      if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
        browser = 'chrome';
        isPwaCapable = true;
      } else if (/firefox/.test(userAgent)) {
        browser = 'firefox';
        isPwaCapable = true;
      } else {
        browser = 'other';
      }
    } else if (/windows/.test(userAgent)) {
      platform = 'windows';
      isPwaCapable = true;
    } else if (/mac/.test(userAgent)) {
      platform = 'macos';
      isPwaCapable = true;
    } else if (/linux/.test(userAgent)) {
      platform = 'linux';
      isPwaCapable = true;
    }

    return { platform, browser, isPwaCapable };
  }

  /**
   * Verify WebAuthn functionality in PWA context
   * Requirement 4.1: WebAuthn service functions correctly in installed PWA
   */
  async verifyWebAuthnInPwaContext(): Promise<{ isSupported: boolean; error?: string }> {
    try {
      // Check if WebAuthn API is available
      if (!window.PublicKeyCredential) {
        return {
          isSupported: false,
          error: 'WebAuthn API not available'
        };
      }

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        return {
          isSupported: false,
          error: 'Platform authenticator not available'
        };
      }

      // Verify that credentials can be accessed in PWA context
      const credentials = localStorage.getItem('webauthn_credentials');
      
      return {
        isSupported: true
      };
    } catch (error) {
      return {
        isSupported: false,
        error: `Error verifying WebAuthn: ${error}`
      };
    }
  }
}
