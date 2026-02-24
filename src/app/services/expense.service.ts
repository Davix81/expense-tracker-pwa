import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Expense } from '../models/expense.model';
import { STORAGE_SERVICE, StorageService } from './storage.token';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Service responsible for expense business logic and state management
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.6
 */
@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly storage = inject(STORAGE_SERVICE);
  
  // BehaviorSubject for expense list state management
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  
  // Public observable for components to subscribe to
  public expenses$ = this.expensesSubject.asObservable();

  /**
   * Retrieves all expenses from GitHub storage
   * 
   * Requirements: 2.1
   * 
   * @returns Observable of expense array
   */
  getExpenses(): Observable<Expense[]> {
    return this.storage.readExpenses().pipe(
      tap(expenses => this.expensesSubject.next(expenses)),
      catchError(error => {
        console.error('Error loading expenses:', error);
        // Return empty array on failure
        return of([]);
      })
    );
  }

  /**
   * Adds a new expense with ID generation and timestamp
   * 
   * Requirements: 2.2, 2.4, 2.5, 2.6
   * 
   * @param expense Expense data without id and createdAt
   * @returns Observable of created expense
   */
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Observable<Expense> {
    // Validate expense data
    const validation = this.validateExpense(expense);
    if (!validation.valid) {
      return throwError(() => new Error(`Validation failed: ${validation.errors.join(', ')}`));
    }

    // Generate ID and timestamp
    const newExpense: Expense = {
      ...expense,
      id: this.generateId(),
      createdAt: new Date()
    };

    // Get current expenses and add new one
    const currentExpenses = this.expensesSubject.value;
    const updatedExpenses = [...currentExpenses, newExpense];

    // Persist to GitHub and reload to ensure we have the latest SHA
    return this.storage.writeExpenses(updatedExpenses).pipe(
      tap(() => {
        // Update local state immediately for UI responsiveness
        this.expensesSubject.next(updatedExpenses);
      }),
      // Reload from GitHub to ensure we have the latest state and SHA
      switchMap(() => this.storage.readExpenses()),
      tap(reloadedExpenses => {
        // Update local state with reloaded data
        this.expensesSubject.next(reloadedExpenses);
      }),
      map(() => newExpense),
      catchError(error => {
        console.error('Error adding expense:', error);
        // Reload expenses on error to ensure consistency
        this.getExpenses().subscribe();
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates an existing expense
   * 
   * Requirements: 2.2, 2.4, 2.5, 2.6
   * 
   * @param expense Updated expense data
   * @returns Observable of updated expense
   */
  updateExpense(expense: Expense): Observable<Expense> {
    // Validate expense data
    const validation = this.validateExpense(expense);
    if (!validation.valid) {
      return throwError(() => new Error(`Validation failed: ${validation.errors.join(', ')}`));
    }

    // Get current expenses
    const currentExpenses = this.expensesSubject.value;
    const expenseIndex = currentExpenses.findIndex(e => e.id === expense.id);

    if (expenseIndex === -1) {
      return throwError(() => new Error('Expense not found'));
    }

    // Update expense in array
    const updatedExpenses = [...currentExpenses];
    updatedExpenses[expenseIndex] = expense;

    // Persist to GitHub and reload to ensure we have the latest SHA
    return this.storage.writeExpenses(updatedExpenses).pipe(
      tap(() => {
        // Update local state immediately for UI responsiveness
        this.expensesSubject.next(updatedExpenses);
      }),
      // Reload from GitHub to ensure we have the latest state and SHA
      switchMap(() => this.storage.readExpenses()),
      tap(reloadedExpenses => {
        // Update local state with reloaded data
        this.expensesSubject.next(reloadedExpenses);
      }),
      map(() => expense),
      catchError(error => {
        console.error('Error updating expense:', error);
        // Reload expenses on error to ensure consistency
        this.getExpenses().subscribe();
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes an expense by ID
   * 
   * @param expenseId ID of expense to delete
   * @returns Observable of boolean indicating success
   */
  deleteExpense(expenseId: string): Observable<boolean> {
    // Get current expenses
    const currentExpenses = this.expensesSubject.value;
    const expenseIndex = currentExpenses.findIndex(e => e.id === expenseId);

    if (expenseIndex === -1) {
      return throwError(() => new Error('Expense not found'));
    }

    // Remove expense from array
    const updatedExpenses = currentExpenses.filter(e => e.id !== expenseId);

    // Persist to GitHub and reload to ensure we have the latest SHA
    return this.storage.writeExpenses(updatedExpenses).pipe(
      tap(() => {
        // Update local state immediately for UI responsiveness
        this.expensesSubject.next(updatedExpenses);
      }),
      // Reload from GitHub to ensure we have the latest state and SHA
      switchMap(() => this.storage.readExpenses()),
      tap(reloadedExpenses => {
        // Update local state with reloaded data
        this.expensesSubject.next(reloadedExpenses);
      }),
      map(() => true),
      catchError(error => {
        console.error('Error deleting expense:', error);
        // Reload expenses on error to ensure consistency
        this.getExpenses().subscribe();
        return throwError(() => error);
      })
    );
  }

  /**
   * Validates expense data structure and business rules
   * 
   * Requirements: 2.6
   * 
   * @param expense Partial expense data to validate
   * @returns ValidationResult with errors if any
   */
  validateExpense(expense: Partial<Expense>): ValidationResult {
    const errors: string[] = [];

    // Required field validation
    if (!expense.name || expense.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!expense.description || expense.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!expense.issuer || expense.issuer.trim() === '') {
      errors.push('Issuer is required');
    }

    if (!expense.category || expense.category.trim() === '') {
      errors.push('Category is required');
    }

    if (!expense.bank || expense.bank.trim() === '') {
      errors.push('Bank is required');
    }

    // Type validation
    if (expense.approximateAmount === undefined || expense.approximateAmount === null) {
      errors.push('Approximate amount is required');
    } else if (typeof expense.approximateAmount !== 'number' || expense.approximateAmount < 0) {
      errors.push('Approximate amount must be a positive number');
    }

    if (!expense.scheduledPaymentDate) {
      errors.push('Scheduled payment date is required');
    } else if (!(expense.scheduledPaymentDate instanceof Date) || isNaN(expense.scheduledPaymentDate.getTime())) {
      errors.push('Scheduled payment date must be a valid date');
    }

    // Optional field validation
    if (expense.actualAmount !== null && expense.actualAmount !== undefined) {
      if (typeof expense.actualAmount !== 'number' || expense.actualAmount < 0) {
        errors.push('Actual amount must be a positive number');
      }
    }

    if (expense.actualPaymentDate !== null && expense.actualPaymentDate !== undefined) {
      if (!(expense.actualPaymentDate instanceof Date) || isNaN(expense.actualPaymentDate.getTime())) {
        errors.push('Actual payment date must be a valid date');
      }
    }

    // Payment status validation
    if (!expense.paymentStatus) {
      errors.push('Payment status is required');
    } else if (!['PENDING', 'PAID', 'FAILED'].includes(expense.paymentStatus)) {
      errors.push('Payment status must be PENDING, PAID, or FAILED');
    }

    // Periodicity validation
    if (!expense.periodicity) {
      errors.push('Periodicity is required');
    } else if (!['MENSUAL', 'BIMENSUAL', 'TRIMESTRAL', 'ANUAL'].includes(expense.periodicity)) {
      errors.push('Periodicity must be MENSUAL, BIMENSUAL, TRIMESTRAL, or ANUAL');
    }

    // Fraction validation
    if (!expense.fraction) {
      errors.push('Fraction is required');
    } else if (!['ÚNICA', 'PRIMERA', 'SEGONA', 'TERCERA', 'QUARTA'].includes(expense.fraction)) {
      errors.push('Fraction must be ÚNICA, PRIMERA, SEGONA, TERCERA, or QUARTA');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates a unique UUID v4 identifier
   * 
   * Requirements: 2.4
   * 
   * @returns UUID v4 string
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Transforms date strings to Date objects
   * Used internally for date conversion when needed
   * 
   * @param expense Expense data with potential date strings
   * @returns Expense with Date objects
   */
  private transformDates(expense: any): Expense {
    return {
      ...expense,
      scheduledPaymentDate: expense.scheduledPaymentDate instanceof Date 
        ? expense.scheduledPaymentDate 
        : new Date(expense.scheduledPaymentDate),
      actualPaymentDate: expense.actualPaymentDate 
        ? (expense.actualPaymentDate instanceof Date 
          ? expense.actualPaymentDate 
          : new Date(expense.actualPaymentDate))
        : null,
      createdAt: expense.createdAt instanceof Date 
        ? expense.createdAt 
        : new Date(expense.createdAt)
    };
  }
}
