import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpenseListPageComponent } from './expense-list-page.component';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/expense.model';

describe('ExpenseListPageComponent', () => {
  let component: ExpenseListPageComponent;
  let fixture: ComponentFixture<ExpenseListPageComponent>;
  let mockExpenseService: any;
  let mockAuthService: any;
  let mockDialog: any;

  const mockExpenses: Expense[] = [
    {
      id: '1',
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      tag: 'test',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date('2024-01-01'),
      actualPaymentDate: null,
      actualAmount: null,
      paymentStatus: 'PENDING',
      bank: 'Test Bank',
      createdAt: new Date()
    }
  ];

  beforeEach(async () => {
    mockExpenseService = {
      getExpenses: vi.fn().mockReturnValue(of(mockExpenses))
    };
    
    mockAuthService = {
      logout: vi.fn()
    };
    
    mockDialog = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ExpenseListPageComponent, NoopAnimationsModule],
      providers: [
        { provide: ExpenseService, useValue: mockExpenseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseListPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load expenses on init', () => {
    fixture.detectChanges();
    expect(mockExpenseService.getExpenses).toHaveBeenCalled();
    expect(component.expenses).toEqual(mockExpenses);
    expect(component.isLoading).toBe(false);
  });

  it('should display loading spinner while fetching data', () => {
    component.isLoading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should display error message on load failure', () => {
    mockExpenseService.getExpenses.mockReturnValue(
      throwError(() => new Error('Load failed'))
    );
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Failed to load expenses. Please try again.');
    expect(component.isLoading).toBe(false);
  });

  it('should display empty state when no expenses', () => {
    mockExpenseService.getExpenses.mockReturnValue(of([]));
    fixture.detectChanges();
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No expenses yet');
  });

  it('should open add expense dialog', () => {
    const dialogRefSpy = {
      afterClosed: vi.fn().mockReturnValue(of(null))
    };
    mockDialog.open.mockReturnValue(dialogRefSpy);

    component.openAddDialog();

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should refresh expenses after dialog closes with result', () => {
    const dialogRefSpy = {
      afterClosed: vi.fn().mockReturnValue(of(mockExpenses[0]))
    };
    mockDialog.open.mockReturnValue(dialogRefSpy);

    component.openAddDialog();

    expect(mockExpenseService.getExpenses).toHaveBeenCalledTimes(2); // Once on init, once after dialog
  });

  it('should call logout on logout button click', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
