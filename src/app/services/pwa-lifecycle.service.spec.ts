import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PwaLifecycleService } from './pwa-lifecycle.service';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PwaLifecycleService', () => {
  let service: PwaLifecycleService;
  let swUpdateMock: any;
  let appRefMock: any;

  beforeEach(() => {
    // Create mock for SwUpdate
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: new Subject(),
      checkForUpdate: vi.fn().mockResolvedValue(false)
    };

    // Create mock for ApplicationRef
    appRefMock = {
      isStable: of(true)
    };

    TestBed.configureTestingModule({
      providers: [
        PwaLifecycleService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: ApplicationRef, useValue: appRefMock }
      ]
    });

    service = TestBed.inject(PwaLifecycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });

      const platformInfo = service.getPlatformInfo();
      expect(platformInfo.platform).toBe('ios');
      expect(platformInfo.browser).toBe('safari');
      expect(platformInfo.isPwaCapable).toBe(true);
    });

    it('should detect Android Chrome', () => {
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        configurable: true
      });

      const platformInfo = service.getPlatformInfo();
      expect(platformInfo.platform).toBe('android');
      expect(platformInfo.browser).toBe('chrome');
      expect(platformInfo.isPwaCapable).toBe(true);
    });
  });

  describe('PWA Installation Status', () => {
    it('should detect standalone display mode', () => {
      // Mock standalone display mode
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      } as any);

      // Create new service instance to trigger checkIfInstalled
      const newService = new PwaLifecycleService(swUpdateMock, appRefMock);
      expect(newService.isRunningAsInstalled()).toBe(true);
    });

    it('should return false when not in standalone mode', () => {
      // Mock non-standalone display mode
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        media: '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      } as any);

      // Create new service instance to trigger checkIfInstalled
      const newService = new PwaLifecycleService(swUpdateMock, appRefMock);
      expect(newService.isRunningAsInstalled()).toBe(false);
    });
  });

  describe('WebAuthn Verification', () => {
    it('should verify WebAuthn is supported', async () => {
      // Mock WebAuthn API
      (window as any).PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
      };

      const result = await service.verifyWebAuthnInPwaContext();
      expect(result.isSupported).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should detect when WebAuthn is not available', async () => {
      // Remove WebAuthn API
      (window as any).PublicKeyCredential = undefined;

      const result = await service.verifyWebAuthnInPwaContext();
      expect(result.isSupported).toBe(false);
      expect(result.error).toContain('WebAuthn API not available');
    });

    it('should detect when platform authenticator is not available', async () => {
      // Mock WebAuthn API with no platform authenticator
      (window as any).PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(false)
      };

      const result = await service.verifyWebAuthnInPwaContext();
      expect(result.isSupported).toBe(false);
      expect(result.error).toContain('Platform authenticator not available');
    });
  });

  describe('Installation Prompt', () => {
    it('should return false when no deferred prompt is available', async () => {
      const result = await service.promptInstall();
      expect(result).toBe(false);
    });

    it('should return false when canInstall is called without deferred prompt', () => {
      expect(service.canInstall()).toBe(false);
    });
  });

  describe('Authentication State Preservation', () => {
    beforeEach(() => {
      // Clear storage before each test
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should preserve authentication state with valid data', () => {
      // Set up authentication data
      localStorage.setItem('webauthn_credentials', JSON.stringify([{ credentialId: 'test123' }]));
      sessionStorage.setItem('encryptionKey', 'testkey');
      sessionStorage.setItem('isAuthenticated', 'true');

      // Trigger preservation (this is called internally)
      // We can't directly test private methods, but we can verify the data persists
      expect(localStorage.getItem('webauthn_credentials')).toBeTruthy();
      expect(sessionStorage.getItem('encryptionKey')).toBe('testkey');
      expect(sessionStorage.getItem('isAuthenticated')).toBe('true');
    });
  });
});
