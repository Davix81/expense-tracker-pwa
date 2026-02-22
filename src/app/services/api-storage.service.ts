import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Expense } from '../models/expense.model';
import { Settings } from '../models/settings.model';
import { environment } from '../../environments/environment';
import { EncryptionService } from './encryption.service';

/**
 * Service for persisting expense data via Vercel API backend
 * 
 * This service communicates with a Vercel serverless backend that
 * handles GitHub API calls securely without exposing tokens.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiStorageService {
  private readonly http = inject(HttpClient);
  private readonly encryptionService = inject(EncryptionService);
  private readonly apiUrl: string = environment.apiUrl;
  private readonly apiSecret: string = environment.apiSecret;
  private readonly dataConfig: string = environment.storageConfig || '';

  /**
   * Default settings to use when settings file doesn't exist
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
   * Reads expenses from backend API
   */
  readExpenses(): Observable<Expense[]> {
    return this.http.get(`${this.apiUrl}/expenses`, { 
      headers: this.buildHeaders(),
      responseType: 'text' // Get as text first
    }).pipe(
      switchMap(content => {
        // Parse content (may be encrypted or plain JSON)
        return from(this.parseContent(content));
      }),
      map(data => this.transformDates(data)),
      catchError(error => {
        if (error.status === 404 || (error.error && error.error.includes('not found'))) {
          console.log('Expense file not found, returning empty array');
          return of([]);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Reads settings from backend API
   */
  readSettings(): Observable<Settings> {
    return this.http.get(`${this.apiUrl}/settings`, { 
      headers: this.buildHeaders(),
      responseType: 'text'
    }).pipe(
      switchMap(content => {
        return from(this.parseContent(content));
      }),
      map(data => this.transformSettingsDates(data)),
      catchError(error => {
        if (error.status === 404) {
          console.log('Settings file not found, returning default settings');
          return of(this.defaultSettings);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Writes expenses to backend API
   */
  writeExpenses(expenses: Expense[]): Observable<void> {
    return from(this.prepareContent(expenses)).pipe(
      switchMap(content => {
        return this.http.put<{ success: boolean }>(
          `${this.apiUrl}/expenses`,
          { content },
          { headers: this.buildHeaders() }
        );
      }),
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Writes settings to backend API
   */
  writeSettings(settings: Settings): Observable<void> {
    const settingsToWrite = {
      ...settings,
      lastUpdated: new Date()
    };

    return from(this.prepareContent(settingsToWrite)).pipe(
      switchMap(content => {
        return this.http.put<{ success: boolean }>(
          `${this.apiUrl}/settings`,
          { content },
          { headers: this.buildHeaders() }
        );
      }),
      map(() => void 0),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Prepares content for API (encrypts if config provided)
   */
  private async prepareContent(data: any): Promise<string> {
    if (this.dataConfig) {
      // Encrypt the data
      return await this.encryptionService.encrypt(data, this.dataConfig);
    } else {
      // Use plain JSON
      return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Parses content, automatically detecting if it's encrypted or plain JSON
   */
  private async parseContent(content: string): Promise<any> {
    const trimmedContent = content.trim();
    
    // Check if it looks like JSON
    if (trimmedContent.startsWith('[') || trimmedContent.startsWith('{')) {
      console.log('Detected plain JSON format');
      try {
        return JSON.parse(trimmedContent);
      } catch (error) {
        console.error('Failed to parse as JSON:', error);
        throw new Error('Invalid JSON format');
      }
    }
    
    // It looks like encrypted data
    if (this.dataConfig) {
      console.log('Detected encrypted format, attempting to decrypt');
      try {
        return await this.encryptionService.decrypt(trimmedContent, this.dataConfig);
      } catch (error) {
        console.error('Failed to decrypt:', error);
        // Try parsing as JSON as fallback
        try {
          return JSON.parse(trimmedContent);
        } catch (jsonError) {
          throw new Error('Failed to decrypt data. The storage configuration may be incorrect.');
        }
      }
    } else {
      console.warn('Data appears to be encrypted but no storage configuration provided');
      throw new Error('Storage configuration is required to read encrypted data');
    }
  }

  /**
   * Builds HTTP headers for API requests
   */
  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiSecret}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Transforms date strings to Date objects
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
   */
  private transformSettingsDates(settings: any): Settings {
    return {
      ...settings,
      lastUpdated: new Date(settings.lastUpdated)
    };
  }

  /**
   * Handles HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      errorMessage = 'Unable to connect to the API. Please check your internet connection.';
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'API authentication failed. Please check your configuration.';
          break;
        case 403:
          errorMessage = 'Access forbidden. Your API credentials may not have the required permissions.';
          break;
        case 404:
          errorMessage = 'Data file not found.';
          break;
        case 500:
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        default:
          errorMessage = `An error occurred: ${error.message}`;
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
