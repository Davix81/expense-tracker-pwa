import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, AuthCredentials } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  let localStorageGetItemSpy: ReturnType<typeof vi.spyOn>;
  let localStorageSetItemSpy: ReturnType<typeof vi.spyOn>;
  let localStorageRemoveItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const routerMock = {
      navigate: vi.fn()
    };
    
    // Mock localStorage
    localStorageGetItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    localStorageRemoveItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock }
      ]
    });
    
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should return true and store session for valid credentials', async () => {
      const validCredentials: AuthCredentials = {
        username: environment.auth.username,
        password: environment.auth.password
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(validCredentials).subscribe(resolve);
      });

      expect(result).toBe(true);
      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        'expense_tracker_session',
        expect.any(String)
      );
    });

    it('should return false for invalid username', async () => {
      const invalidCredentials: AuthCredentials = {
        username: 'wronguser',
        password: environment.auth.password
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(invalidCredentials).subscribe(resolve);
      });

      expect(result).toBe(false);
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });

    it('should return false for invalid password', async () => {
      const invalidCredentials: AuthCredentials = {
        username: environment.auth.username,
        password: 'wrongpassword'
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(invalidCredentials).subscribe(resolve);
      });

      expect(result).toBe(false);
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });

    it('should return false for both invalid username and password', async () => {
      const invalidCredentials: AuthCredentials = {
        username: 'wronguser',
        password: 'wrongpassword'
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(invalidCredentials).subscribe(resolve);
      });

      expect(result).toBe(false);
      expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });

    it('should generate unique session tokens', async () => {
      const validCredentials: AuthCredentials = {
        username: environment.auth.username,
        password: environment.auth.password
      };

      await new Promise<void>(resolve => {
        service.login(validCredentials).subscribe(() => resolve());
      });
      const token1 = localStorageSetItemSpy.mock.calls[0][1];

      await new Promise<void>(resolve => {
        service.login(validCredentials).subscribe(() => resolve());
      });
      const token2 = localStorageSetItemSpy.mock.calls[1][1];

      expect(token1).not.toEqual(token2);
      expect(token1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(token2).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('logout', () => {
    it('should clear session from localStorage', () => {
      service.logout();
      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('expense_tracker_session');
    });

    it('should navigate to login page', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session exists', () => {
      localStorageGetItemSpy.mockReturnValue('session_123_abc');
      
      const result = service.isAuthenticated();
      
      expect(result).toBe(true);
      expect(localStorageGetItemSpy).toHaveBeenCalledWith('expense_tracker_session');
    });

    it('should return false when session does not exist', () => {
      localStorageGetItemSpy.mockReturnValue(null);
      
      const result = service.isAuthenticated();
      
      expect(result).toBe(false);
      expect(localStorageGetItemSpy).toHaveBeenCalledWith('expense_tracker_session');
    });
  });

  describe('getSession', () => {
    it('should return session token when it exists', () => {
      const token = 'session_123_abc';
      localStorageGetItemSpy.mockReturnValue(token);
      
      const result = service.getSession();
      
      expect(result).toBe(token);
      expect(localStorageGetItemSpy).toHaveBeenCalledWith('expense_tracker_session');
    });

    it('should return null when session does not exist', () => {
      localStorageGetItemSpy.mockReturnValue(null);
      
      const result = service.getSession();
      
      expect(result).toBeNull();
      expect(localStorageGetItemSpy).toHaveBeenCalledWith('expense_tracker_session');
    });
  });

  describe('session persistence', () => {
    it('should persist session across service instances', async () => {
      const validCredentials: AuthCredentials = {
        username: environment.auth.username,
        password: environment.auth.password
      };

      await new Promise<void>(resolve => {
        service.login(validCredentials).subscribe(() => resolve());
      });

      const storedToken = localStorageSetItemSpy.mock.calls[0][1];
      
      // Simulate retrieving session
      localStorageGetItemSpy.mockReturnValue(storedToken);
      
      const retrievedToken = service.getSession();
      expect(retrievedToken).toBe(storedToken);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty username', async () => {
      const credentials: AuthCredentials = {
        username: '',
        password: environment.auth.password
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(credentials).subscribe(resolve);
      });

      expect(result).toBe(false);
    });

    it('should handle empty password', async () => {
      const credentials: AuthCredentials = {
        username: environment.auth.username,
        password: ''
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(credentials).subscribe(resolve);
      });

      expect(result).toBe(false);
    });

    it('should handle whitespace in credentials', async () => {
      const credentials: AuthCredentials = {
        username: '  ' + environment.auth.username + '  ',
        password: environment.auth.password
      };

      const result = await new Promise<boolean>(resolve => {
        service.login(credentials).subscribe(resolve);
      });

      expect(result).toBe(false);
    });
  });
});
