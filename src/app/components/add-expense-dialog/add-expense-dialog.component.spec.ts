import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AddExpenseDialogComponent } from './add-expense-dialog.component';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

describe('AddExpenseDialogComponent', () => {
  let component: AddExpenseDialogComponent;
  let fixture: ComponentFixture<AddExpenseDialogComponent>;
  let mockExpenseService: jasmine.SpyObj<ExpenseService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddExpenseDialogComponent>>;

  beforeEach(async () => {
    mockExpenseService = jasmine.createSpyObj('ExpenseService', ['addExpense']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddExpenseDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: ExpenseService, useValue: mockExpenseService },
        { provide: MatDialogRef, useValue: mockDialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddExpenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.expenseForm).toBeDefined();
    expect(component.expenseForm.get('paymentStatus')?.value).toBe('PENDING');
  });

  it('should mark form as invalid when required fields are empty', () => {
    expect(component.expenseForm.valid).toBeFalse();
  });

  it('should mark form as valid when all required fields are filled', () => {
    component.expenseForm.patchValue({
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      paymentStatus: 'PENDING',
      bank: 'Test Bank'
    });

    expect(component.expenseForm.valid).toBeTrue();
  });

  it('should call expenseService.addExpense on valid form submission', () => {
    const mockExpense: Expense = {
      id: '123',
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      tag: '',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      actualPaymentDate: null,
      actualAmount: null,
      paymentStatus: 'PENDING',
      bank: 'Test Bank',
      createdAt: new Date()
    };

    mockExpenseService.addExpense.and.returnValue(of(mockExpense));

    component.expenseForm.patchValue({
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      paymentStatus: 'PENDING',
      bank: 'Test Bank'
    });

    component.onSubmit();

    expect(mockExpenseService.addExpense).toHaveBeenCalled();
  });

  it('should close dialog with result on successful submission', () => {
    const mockExpense: Expense = {
      id: '123',
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      tag: '',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      actualPaymentDate: null,
      actualAmount: null,
      paymentStatus: 'PENDING',
      bank: 'Test Bank',
      createdAt: new Date()
    };

    mockExpenseService.addExpense.and.returnValue(of(mockExpense));

    component.expenseForm.patchValue({
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      paymentStatus: 'PENDING',
      bank: 'Test Bank'
    });

    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith(mockExpense);
  });

  it('should display error message on submission failure', () => {
    const errorMessage = 'Failed to add expense';
    mockExpenseService.addExpense.and.returnValue(
      throwError(() => new Error(errorMessage))
    );

    component.expenseForm.patchValue({
      name: 'Test Expense',
      description: 'Test Description',
      issuer: 'Test Issuer',
      category: 'Utilities',
      approximateAmount: 100,
      scheduledPaymentDate: new Date(),
      paymentStatus: 'PENDING',
      bank: 'Test Bank'
    });

    component.onSubmit();

    expect(component.errorMessage).toContain(errorMessage);
    expect(component.isSubmitting).toBeFalse();
  });

  it('should close dialog without result on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should not submit form when invalid', () => {
    component.expenseForm.patchValue({
      name: '', // Invalid - required field
      description: 'Test Description'
    });

    component.onSubmit();

    expect(mockExpenseService.addExpense).not.toHaveBeenCalled();
  });

  it('should validate minimum value for approximateAmount', () => {
    const control = component.expenseForm.get('approximateAmount');
    control?.setValue(-10);
    expect(control?.hasError('min')).toBeTrue();
  });

  it('should validate minimum value for actualAmount', () => {
    const control = component.expenseForm.get('actualAmount');
    control?.setValue(-10);
    expect(control?.hasError('min')).toBeTrue();
  });

  it('should return correct error messages for fields', () => {
    const nameControl = component.expenseForm.get('name');
    nameControl?.markAsTouched();
    nameControl?.setValue('');

    const errorMessage = component.getErrorMessage('name');
    expect(errorMessage).toBe('Name is required');
  });
});
