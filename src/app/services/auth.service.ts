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

  constructor(private router: Router) {}

  login(credentials: AuthCredentials): Observable<boolean> {
    if (this.validateCredentials(credentials)) {
      const token = this.generateSessionToken();
      this.setSession(token);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  getSession(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  private validateCredentials(credentials: AuthCredentials): boolean {
    return credentials.username === environment.auth.username &&
           credentials.password === environment.auth.password;
  }

  private setSession(token: string): void {
    localStorage.setItem(this.SESSION_KEY, token);
  }

  private clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  private generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
