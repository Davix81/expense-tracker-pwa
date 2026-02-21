import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, map, retry, switchMap } from 'rxjs/operators';
import { Expense, GitHubConfig, GitHubFileResponse } from '../models/expense.model';
import { Settings } from '../models/settings.model';
import { environment } from '../../environments/environment';
import { EncryptionService } from './encryption.service';

/**
 * Service responsible for persisting expense data to GitHub repository
 * with encryption support
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 */
@Injectable({
  providedIn: 'root'
})
export class GitHubStorageService {
  private readonly http = inject(HttpClient);
  private readonly encryptionService = inject(EncryptionService);
  private readonly config: GitHubConfig = environment.github;
  private readonly dataConfig: string = environment.storageConfig || '';
  private readonly baseUrl = 'https://api.github.com';
  private readonly maxRetries = 3;

  /**
   * Default settings to use when settings file doesn't exist
   *
   * Requirements: 9.6
   */
  private readonly defaultSettings: Settings = {
    categories: [
      'Subministraments',
      'Lloguer/Hipoteca',
      'Assegurança',
      'Subscripcions',
      'Telecomunicacions',
      'Salut',
      'Oci',
      'Educació'
    ],
    tags: [
      'Hogar',
      'Transporte',
      'Entretenimiento',
      'Salud',
      'Formación',
      'Personal'
    ],
    lastUpdated: new Date()
  };

  /**
   * Reads expenses from GitHub repository and decrypts them
   *
   * Requirements: 5.1, 5.2
   *
   * @returns Observable of expense array
   */
  readExpenses(): Observable<Expense[]> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`;

    return this.http.get<GitHubFileResponse>(url, { headers: this.buildHeaders() }).pipe(
      switchMap(response => {
        const content = this.decodeContent(response.content);
        
        // If encryption key is provided, decrypt the content
        if (this.dataConfig) {
          return from(this.encryptionService.decrypt(content, this.dataConfig));
        }
        
        // Otherwise, parse as plain JSON
        return of(JSON.parse(content));
      }),
      map(data => this.transformDates(data)),
      catchError(error => {
        // If file doesn't exist (404), return empty array
        if (error.status === 404) {
          console.log('Expense file not found, returning empty array');
          return of([]);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Reads settings from GitHub repository and decrypts them
   *
   * Requirements: 9.1, 9.2, 9.6
   *
   * @returns Observable of Settings object
   */
  readSettings(): Observable<Settings> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.settingsFilePath}`;

    return this.http.get<GitHubFileResponse>(url, { headers: this.buildHeaders() }).pipe(
      switchMap(response => {
        const content = this.decodeContent(response.content);
        
        // If encryption key is provided, decrypt the content
        if (this.dataConfig) {
          return from(this.encryptionService.decrypt(content, this.dataConfig));
        }
        
        // Otherwise, parse as plain JSON
        return of(JSON.parse(content));
      }),
      map(data => this.transformSettingsDates(data)),
      catchError(error => {
        // If file doesn't exist (404), return default settings
        if (error.status === 404) {
          console.log('Settings file not found, returning default settings');
          return of(this.defaultSettings);
        }
        return this.handleError(error);
      })
    );
  }
  /**
   * Writes settings to GitHub repository
   *
   * Requirements: 9.1, 9.4
   *
   * @param settings Settings object to persist
   * @returns Observable that completes when write is successful
   */
  writeSettings(settings: Settings): Observable<void> {
    // Update timestamp before writing
    const settingsToWrite = {
      ...settings,
      lastUpdated: new Date()
    };

    return this.getSettingsFileSha().pipe(
      switchMap(sha => this.commitSettings(settingsToWrite, sha)),
      catchError(error => {
        if (error.status === 409) {
          return this.handleSettingsConflict(settingsToWrite, 1);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Writes expenses to GitHub repository
   *
   * Requirements: 5.3, 5.4, 5.5
   *
   * @param expenses Array of expenses to persist
   * @returns Observable that completes when write is successful
   */
  writeExpenses(expenses: Expense[]): Observable<void> {
    return this.getFileSha().pipe(
      switchMap(sha => this.commitExpenses(expenses, sha)),
      catchError(error => {
        if (error.status === 409) {
          return this.handleConflict(expenses, 1);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Retrieves the current file SHA for updates
   *
   * Requirements: 5.4
   *
   * @returns Observable of file SHA string
   */
  private getFileSha(): Observable<string> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`;

    return this.http.get<GitHubFileResponse>(url, { headers: this.buildHeaders() }).pipe(
      map(response => response.sha),
      catchError(error => {
        // If file doesn't exist (404), return empty string to create new file
        if (error.status === 404) {
          return of('');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Retrieves the current settings file SHA for updates
   *
   * Requirements: 9.4
   *
   * @returns Observable of file SHA string
   */
  private getSettingsFileSha(): Observable<string> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.settingsFilePath}`;

    return this.http.get<GitHubFileResponse>(url, { headers: this.buildHeaders() }).pipe(
      map(response => response.sha),
      catchError(error => {
        // If file doesn't exist (404), return empty string to create new file
        if (error.status === 404) {
          return of('');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Commits expenses to GitHub with encryption
   *
   * @param expenses Expenses to commit
   * @param sha Current file SHA (empty string for new file)
   * @returns Observable that completes when commit is successful
   */
  private commitExpenses(expenses: Expense[], sha: string): Observable<void> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`;

    return from(this.prepareContent(expenses)).pipe(
      switchMap(content => {
        const body: any = {
          message: `Update expenses - ${new Date().toISOString()}`,
          content: content,
          branch: this.config.branch
        };

        // Only include SHA if file exists
        if (sha) {
          body.sha = sha;
        }

        return this.http.put(url, body, { headers: this.buildHeaders() });
      }),
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Commits settings to GitHub with encryption
   *
   * Requirements: 9.1, 9.4
   *
   * @param settings Settings to commit
   * @param sha Current file SHA (empty string for new file)
   * @returns Observable that completes when commit is successful
   */
  private commitSettings(settings: Settings, sha: string): Observable<void> {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.settingsFilePath}`;

    return from(this.prepareContent(settings)).pipe(
      switchMap(content => {
        const body: any = {
          message: `Update settings - ${new Date().toISOString()}`,
          content: content,
          branch: this.config.branch
        };

        // Only include SHA if file exists
        if (sha) {
          body.sha = sha;
        }

        return this.http.put(url, body, { headers: this.buildHeaders() });
      }),
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Prepares content for GitHub commit (encrypts if key is provided, then Base64 encodes)
   *
   * @param data Data to prepare
   * @returns Promise<string> Base64 encoded content
   */
  private async prepareContent(data: any): Promise<string> {
    let contentToEncode: string;
    
    if (this.dataConfig) {
      // Encrypt the data first
      contentToEncode = await this.encryptionService.encrypt(data, this.dataConfig);
    } else {
      // Use plain JSON
      contentToEncode = JSON.stringify(data, null, 2);
    }
    
    // Base64 encode for GitHub
    return btoa(unescape(encodeURIComponent(contentToEncode)));
  }

  /**
   * Encodes expense data as Base64 JSON (legacy method, kept for compatibility)
   *
   * Requirements: 5.3
   *
   * @param data Data to encode
   * @returns Base64 encoded string
   */
  private encodeContent(data: any): string {
    const json = JSON.stringify(data, null, 2);
    // Use btoa for Base64 encoding in browser
    return btoa(unescape(encodeURIComponent(json)));
  }

  /**
   * Decodes Base64 JSON content (returns string for further processing)
   *
   * Requirements: 5.2
   *
   * @param content Base64 encoded content
   * @returns Decoded string (may be encrypted or plain JSON)
   */
  private decodeContent(content: string): string {
    // Remove whitespace and newlines from Base64 content
    const cleanContent = content.replace(/\s/g, '');
    // Use atob for Base64 decoding in browser
    return decodeURIComponent(escape(atob(cleanContent)));
  }

  /**
   * Builds HTTP headers for GitHub API requests
   * Supports both authenticated and public repository access
   *
   * Requirements: 5.7
   *
   * @returns HttpHeaders with authentication (if token provided) and content type
   */
  private buildHeaders(): HttpHeaders {
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if token is provided
    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Handles conflict errors with retry logic
   *
   * Requirements: 5.5
   *
   * @param expenses Expenses to write
   * @param attempt Current attempt number
   * @returns Observable that retries the write operation
   */
  private handleConflict(expenses: Expense[], attempt: number): Observable<void> {
    if (attempt >= this.maxRetries) {
      return throwError(() => new Error('Unable to save changes due to conflicts. Please refresh and try again.'));
    }

    // Fetch new SHA and retry
    return this.getFileSha().pipe(
      switchMap(sha => this.commitExpenses(expenses, sha)),
      catchError(error => {
        if (error.status === 409) {
          return this.handleConflict(expenses, attempt + 1);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Handles conflict errors with retry logic for settings
   *
   * Requirements: 9.4
   *
   * @param settings Settings to write
   * @param attempt Current attempt number
   * @returns Observable that retries the write operation
   */
  private handleSettingsConflict(settings: Settings, attempt: number): Observable<void> {
    if (attempt >= this.maxRetries) {
      return throwError(() => new Error('Unable to save settings due to conflicts. Please refresh and try again.'));
    }

    // Fetch new SHA and retry
    return this.getSettingsFileSha().pipe(
      switchMap(sha => this.commitSettings(settings, sha)),
      catchError(error => {
        if (error.status === 409) {
          return this.handleSettingsConflict(settings, attempt + 1);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Transforms date strings to Date objects
   *
   * @param expenses Array of expense data with date strings
   * @returns Array of expenses with Date objects
   */
  private transformDates(expenses: any[]): Expense[] {
    return expenses.map(expense => ({
      ...expense,
      scheduledPaymentDate: new Date(expense.scheduledPaymentDate),
      actualPaymentDate: expense.actualPaymentDate ? new Date(expense.actualPaymentDate) : null,
      createdAt: new Date(expense.createdAt)
    }));
  }

  /**
   * Transforms lastUpdated date string to Date object in Settings
   *
   * Requirements: 9.2
   *
   * @param settings Settings data with lastUpdated as string
   * @returns Settings with lastUpdated as Date object
   */
  private transformSettingsDates(settings: any): Settings {
    return {
      ...settings,
      lastUpdated: new Date(settings.lastUpdated)
    };
  }

  /**
   * Handles HTTP errors and returns descriptive error messages
   *
   * Requirements: 5.6, 5.9
   *
   * @param error HTTP error response
   * @returns Observable that throws descriptive error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = 'Unable to connect to GitHub. Please check your internet connection.';
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'GitHub authentication failed. Please check your access token configuration.';
          break;
        case 403:
          errorMessage = 'GitHub authentication failed. Your access token may not have the required permissions.';
          break;
        case 404:
          errorMessage = 'Expense data file not found. It may have been deleted.';
          break;
        case 409:
          errorMessage = 'Unable to save changes due to conflicts. Please refresh and try again.';
          break;
        case 429:
          const retryAfter = error.headers.get('Retry-After');
          const minutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 'a few';
          errorMessage = `GitHub API rate limit exceeded. Please try again in ${minutes} minutes.`;
          break;
        default:
          errorMessage = `An error occurred while accessing GitHub: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
