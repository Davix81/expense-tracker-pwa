import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpenseService, ValidationResult } from './expense.service';
import { GitHubStorageService } from './github-storage.service';
import { Expense, PaymentStatus } from '../models/expense.model';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let githubStorageService: any;

  const mockExpense: Omit<Expense, 'id' | 'createdAt'> = {
    name: 'Electric Bill',
    description: 'Monthly electricity payment',
    issuer: 'Power Company',
    tag: 'utilities',
    category: 'Utilities',
    approximateAmount: 150.00,
    scheduledPaymentDate: new Date('2024-02-15'),
    actualPaymentDate: null,
    actualAmount: null,
    paymentStatus: 'PENDING' as PaymentStatus,
    bank: 'Chase Bank'
  };

  const mockExpenseWithId: Expense = {
    ...mockExpense,
    id: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    const githubStorageMock = {
      readExpenses: vi.fn(),
      writeExpenses: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        { provide: GitHubStorageService, useValue: githubStorageMock }
      ]
    });

    service = TestBed.inject(ExpenseService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getExpenses', () => {
    it('should retrieve expenses from GitHub storage', async () => {
      const mockExpenses: Expense[] = [mockExpenseWithId];
      githubStorageService.readExpenses.mockReturnValue(of(mockExpenses));

      const result = await new Promise<Expense[]>(resolve => {
        service.getExpenses().subscribe(resolve);
      });

      expect(result).toEqual(mockExpenses);
      expect(githubStorageService.readExpenses).toHaveBeenCalled();
    });

    it('should update expenses$ observable when expenses are loaded', async () => {
      const mockExpenses: Expense[] = [mockExpenseWithId];
      githubStorageService.readExpenses.mockReturnValue(of(mockExpenses));

      await new Promise<void>(resolve => {
        service.getExpenses().subscribe(() => {
          service.expenses$.subscribe(expenses => {
            expect(expenses).toEqual(mockExpenses);
            resolve();
          });
        });
      });
    });

    it('should return empty array on error', async () => {
      githubStorageService.readExpenses.mockReturnValue(
        throwError(() => new Error('GitHub error'))
      );

      const result = await new Promise<Expense[]>(resolve => {
        service.getExpenses().subscribe(resolve);
      });

      expect(result).toEqual([]);
    });
  });

  describe('addExpense', () => {
    it('should add expense with generated ID and timestamp', async () => {
      githubStorageService.writeExpenses.mockReturnValue(of(void 0));

      const result = await new Promise<Expense>(resolve => {
        service.addExpense(mockExpense).subscribe(resolve);
      });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.name).toBe(mockExpense.name);
    });

    it('should persist expense via GitHub storage', async () => {
      githubStorageService.writeExpenses.mockReturnValue(of(void 0));

      await new Promise<void>(resolve => {
        service.addExpense(mockExpense).subscribe(() => {
          expect(githubStorageService.writeExpenses).toHaveBeenCalled();
          const callArgs = githubStorageService.writeExpenses.mock.calls[0][0];
          expect(callArgs.length).toBe(1);
          expect(callArgs[0].name).toBe(mockExpense.name);
          resolve();
        });
      });
    });

    it('should update expenses$ observable after adding', async () => {
      githubStorageService.writeExpenses.mockReturnValue(of(void 0));

      const newExpense = await new Promise<Expense>(resolve => {
        service.addExpense(mockExpense).subscribe(resolve);
      });

      await new Promise<void>(resolve => {
        service.expenses$.subscribe(expenses => {
          expect(expenses.length).toBe(1);
          expect(expenses[0].id).toBe(newExpense.id);
          resolve();
        });
      });
    });

    it('should reject invalid expense data', async () => {
      const invalidExpense = { ...mockExpense, name: '' };

      try {
        await new Promise<Expense>((resolve, reject) => {
          service.addExpense(invalidExpense).subscribe({
            next: resolve,
            error: reject
          });
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Validation failed');
        expect(githubStorageService.writeExpenses).not.toHaveBeenCalled();
      }
    });

    it('should handle storage errors', async () => {
      githubStorageService.writeExpenses.mockReturnValue(
        throwError(() => new Error('Storage error'))
      );

      try {
        await new Promise<Expense>((resolve, reject) => {
          service.addExpense(mockExpense).subscribe({
            next: resolve,
            error: reject
          });
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Storage error');
      }
    });
  });

  describe('validateExpense', () => {
    it('should validate a valid expense', () => {
      const result: ValidationResult = service.validateExpense(mockExpense);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject expense with missing name', () => {
      const invalid = { ...mockExpense, name: '' };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should reject expense with missing description', () => {
      const invalid = { ...mockExpense, description: '' };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should reject expense with negative amount', () => {
      const invalid = { ...mockExpense, approximateAmount: -100 };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Approximate amount must be a positive number');
    });

    it('should reject expense with invalid payment status', () => {
      const invalid = { ...mockExpense, paymentStatus: 'INVALID' as PaymentStatus };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Payment status must be PENDING, PAID, or FAILED');
    });

    it('should reject expense with invalid date', () => {
      const invalid = { ...mockExpense, scheduledPaymentDate: new Date('invalid') };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Scheduled payment date must be a valid date');
    });

    it('should reject expense with actual payment date before scheduled date', () => {
      const invalid = {
        ...mockExpense,
        scheduledPaymentDate: new Date('2024-02-15'),
        actualPaymentDate: new Date('2024-02-10')
      };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Actual payment date cannot be before scheduled payment date');
    });

    it('should accept expense with null optional fields', () => {
      const valid = {
        ...mockExpense,
        actualPaymentDate: null,
        actualAmount: null
      };
      const result = service.validateExpense(valid);
      expect(result.valid).toBe(true);
    });

    it('should reject expense with negative actual amount', () => {
      const invalid = { ...mockExpense, actualAmount: -50 };
      const result = service.validateExpense(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Actual amount must be a positive number');
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for multiple expenses', async () => {
      githubStorageService.writeExpenses.mockReturnValue(of(void 0));

      const ids = new Set<string>();
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 5; i++) {
        const promise = new Promise<void>(resolve => {
          service.addExpense(mockExpense).subscribe(expense => {
            ids.add(expense.id);
            resolve();
          });
        });
        promises.push(promise);
      }

      await Promise.all(promises);
      expect(ids.size).toBe(5); // All IDs should be unique
    });
  });

  describe('timestamp creation', () => {
    it('should set createdAt timestamp when creating expense', async () => {
      githubStorageService.writeExpenses.mockReturnValue(of(void 0));
      const beforeCreate = new Date();

      const result = await new Promise<Expense>(resolve => {
        service.addExpense(mockExpense).subscribe(resolve);
      });

      const afterCreate = new Date();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });
});
