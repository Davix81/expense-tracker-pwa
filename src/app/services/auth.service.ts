import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'expense_tracker_session';
  private readonly ENCRYPTION_KEY = 'expense_tracker_encryption_key';

  constructor(private router: Router) {}

  login(credentials: AuthCredentials): Observable<boolean> {
    // The "password" is actually the encryption key
    // We store it temporarily to validate it can decrypt data
    if (credentials.password && credentials.password.length >= 8) {
      const token = this.generateSessionToken();
      this.setSession(token);
      // Store the encryption key for use by encryption service
      this.setEncryptionKey(credentials.password);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    this.clearSession();
    this.clearEncryptionKey();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    const key = this.getEncryptionKey();
    return session !== null && key !== null;
  }

  getSession(): string | null {
    return sessionStorage.getItem(this.SESSION_KEY);
  }

  getEncryptionKey(): string | null {
    return sessionStorage.getItem(this.ENCRYPTION_KEY);
  }

  private setSession(token: string): void {
    sessionStorage.setItem(this.SESSION_KEY, token);
  }

  private setEncryptionKey(key: string): void {
    sessionStorage.setItem(this.ENCRYPTION_KEY, key);
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  private clearEncryptionKey(): void {
    sessionStorage.removeItem(this.ENCRYPTION_KEY);
  }

  private generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

