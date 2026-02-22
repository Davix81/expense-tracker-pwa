import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { Settings } from '../models/settings.model';

/**
 * Interface for storage service
 */
export interface StorageService {
  readExpenses(): Observable<Expense[]>;
  writeExpenses(expenses: Expense[]): Observable<void>;
  readSettings(): Observable<Settings>;
  writeSettings(settings: Settings): Observable<void>;
}

/**
 * Injection token for storage service
 */
export const STORAGE_SERVICE = new InjectionToken<StorageService>('StorageService');
