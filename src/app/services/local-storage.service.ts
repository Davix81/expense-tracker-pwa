import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Expense } from '../models/expense.model';
import { Settings } from '../models/settings.model';
import { StorageService } from './storage.token';

/**
 * Local storage service for development mode
 * Reads from local JSON files and stores changes in memory
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStorageService implements StorageService {
  private readonly http = inject(HttpClient);
  
  // In-memory storage for changes during session
  private expensesCache: Expense[] | null = null;
  private settingsCache: Settings | null = null;

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
   * Reads expenses from local JSON file or memory cache
   */
  readExpenses(): Observable<Expense[]> {
    if (this.expensesCache !== null) {
      console.log('[LocalStorage] Returning cached expenses');
      return of(this.expensesCache);
    }

    return this.http.get<Expense[]>('assets/data/expenses.json').pipe(
      map(expenses => this.transformDates(expenses)),
      tap(expenses => {
        this.expensesCache = expenses;
        console.log('[LocalStorage] Loaded expenses from local file:', expenses.length);
      }),
      catchError(error => {
        console.warn('[LocalStorage] Could not load expenses.json, returning empty array:', error);
        this.expensesCache = [];
        return of([]);
      })
    );
  }

  /**
   * Writes expenses to memory cache (persists during session)
   */
  writeExpenses(expenses: Expense[]): Observable<void> {
    this.expensesCache = expenses;
    console.log('[LocalStorage] Saved expenses to memory cache:', expenses.length);
    return of(void 0);
  }

  /**
   * Reads settings from local JSON file or memory cache
   */
  readSettings(): Observable<Settings> {
    if (this.settingsCache !== null) {
      console.log('[LocalStorage] Returning cached settings');
      return of(this.settingsCache);
    }

    return this.http.get<Settings>('assets/data/settings.json').pipe(
      map(settings => this.transformSettingsDates(settings)),
      tap(settings => {
        this.settingsCache = settings;
        console.log('[LocalStorage] Loaded settings from local file');
      }),
      catchError(error => {
        console.warn('[LocalStorage] Could not load settings.json, using defaults:', error);
        this.settingsCache = this.defaultSettings;
        return of(this.defaultSettings);
      })
    );
  }

  /**
   * Writes settings to memory cache (persists during session)
   */
  writeSettings(settings: Settings): Observable<void> {
    this.settingsCache = {
      ...settings,
      lastUpdated: new Date()
    };
    console.log('[LocalStorage] Saved settings to memory cache');
    return of(void 0);
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
   * Transforms lastUpdated date string to Date object
   */
  private transformSettingsDates(settings: any): Settings {
    return {
      ...settings,
      lastUpdated: new Date(settings.lastUpdated)
    };
  }
}
