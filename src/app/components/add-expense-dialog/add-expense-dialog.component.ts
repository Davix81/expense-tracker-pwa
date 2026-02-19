import { Component, inject, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseService } from '../../services/expense.service';
import { SettingsService } from '../../services/settings.service';
import { Expense, PaymentStatus, Periodicity, Fraction } from '../../models/expense.model';
import { Observable } from 'rxjs';
import { NotificationMessageComponent } from '../notification-message/notification-message.component';

/**
 * Dialog component for adding or editing expenses
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6
 */
@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    NotificationMessageComponent
  ],
  templateUrl: './add-expense-dialog.component.html',
  styleUrls: ['./add-expense-dialog.component.scss']
})
export class AddExpenseDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddExpenseDialogComponent>);
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);

  expenseForm: FormGroup;
  errorMessage: string = '';
  showErrorMessage: boolean = false;
  isSubmitting: boolean = false;
  isEditMode: boolean = false;
  expenseId?: string;

  // Dynamic categories and tags from SettingsService
  categories$: Observable<string[]> = this.settingsService.categories$;
  tags$: Observable<string[]> = this.settingsService.tags$;

  // Payment status options
  paymentStatuses: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED'];
  
  // Periodicity options
  periodicities: Periodicity[] = ['MENSUAL', 'BIMENSUAL', 'TRIMESTRAL', 'ANUAL'];
  
  // Fraction options
  fractions: Fraction[] = ['ÚNICA', 'PRIMERA', 'SEGONA', 'TERCERA', 'QUARTA'];

  constructor(@Inject(MAT_DIALOG_DATA) public data?: { expense: Expense }) {
    this.isEditMode = !!data?.expense;
    this.expenseId = data?.expense?.id;

    this.expenseForm = this.fb.group({
      name: [data?.expense?.name || '', [Validators.required]],
      description: [data?.expense?.description || '', [Validators.required]],
      issuer: [data?.expense?.issuer || '', [Validators.required]],
      tag: [data?.expense?.tag || ''],
      category: [data?.expense?.category || '', [Validators.required]],
      approximateAmount: [data?.expense?.approximateAmount || null, [Validators.required, Validators.min(0)]],
      scheduledPaymentDate: [data?.expense?.scheduledPaymentDate ? new Date(data.expense.scheduledPaymentDate) : null, [Validators.required]],
      actualPaymentDate: [data?.expense?.actualPaymentDate ? new Date(data.expense.actualPaymentDate) : null],
      actualAmount: [data?.expense?.actualAmount || null, [Validators.min(0)]],
      paymentStatus: [data?.expense?.paymentStatus || 'PENDING', [Validators.required]],
      bank: [data?.expense?.bank || '', [Validators.required]],
      periodicity: [data?.expense?.periodicity || 'MENSUAL', [Validators.required]],
      fraction: [data?.expense?.fraction || 'ÚNICA', [Validators.required]]
    });

    // Escuchar cambios en el estado de pago para actualizar validaciones
    this.expenseForm.get('paymentStatus')?.valueChanges.subscribe(status => {
      this.updatePaymentValidations(status);
    });

    // Aplicar validaciones iniciales si está en modo edición
    if (this.isEditMode && data?.expense?.paymentStatus) {
      this.updatePaymentValidations(data.expense.paymentStatus);
    }
  }

  /**
   * Actualiza las validaciones de los campos de pago según el estado
   */
  private updatePaymentValidations(status: PaymentStatus): void {
    const actualAmountControl = this.expenseForm.get('actualAmount');
    const actualDateControl = this.expenseForm.get('actualPaymentDate');

    if (status === 'PAID') {
      // Si el estado es PAID, hacer obligatorios los campos de pago real
      actualAmountControl?.setValidators([Validators.required, Validators.min(0)]);
      actualDateControl?.setValidators([Validators.required]);
    } else {
      // Si no es PAID, los campos son opcionales
      actualAmountControl?.setValidators([Validators.min(0)]);
      actualDateControl?.clearValidators();
    }

    // Actualizar el estado de validación
    actualAmountControl?.updateValueAndValidity();
    actualDateControl?.updateValueAndValidity();
  }

  /**
   * Handles form submission
   * Requirements: 4.2, 4.3
   */
  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.showErrorMessage = false;
    this.errorMessage = '';

    const formValue = this.expenseForm.value;

    if (this.isEditMode && this.expenseId) {
      // Update existing expense
      const updatedExpense: Expense = {
        id: this.expenseId,
        name: formValue.name,
        description: formValue.description,
        issuer: formValue.issuer,
        tag: formValue.tag || '',
        category: formValue.category,
        approximateAmount: formValue.approximateAmount,
        scheduledPaymentDate: formValue.scheduledPaymentDate,
        actualPaymentDate: formValue.actualPaymentDate || null,
        actualAmount: formValue.actualAmount || null,
        paymentStatus: formValue.paymentStatus,
        bank: formValue.bank,
        periodicity: formValue.periodicity,
        fraction: formValue.fraction,
        createdAt: this.data!.expense.createdAt
      };

      this.expenseService.updateExpense(updatedExpense).subscribe({
        next: (expense) => {
          this.dialogRef.close(expense);
        },
        error: (error) => {
          setTimeout(() => {
            this.errorMessage = error.message || 'Error al actualitzar la despesa. Torna-ho a intentar.';
            this.showErrorMessage = true;
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      // Add new expense
      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        name: formValue.name,
        description: formValue.description,
        issuer: formValue.issuer,
        tag: formValue.tag || '',
        category: formValue.category,
        approximateAmount: formValue.approximateAmount,
        scheduledPaymentDate: formValue.scheduledPaymentDate,
        actualPaymentDate: formValue.actualPaymentDate || null,
        actualAmount: formValue.actualAmount || null,
        paymentStatus: formValue.paymentStatus,
        bank: formValue.bank,
        periodicity: formValue.periodicity,
        fraction: formValue.fraction
      };

      this.expenseService.addExpense(expenseData).subscribe({
        next: (expense) => {
          this.dialogRef.close(expense);
        },
        error: (error) => {
          setTimeout(() => {
            this.errorMessage = error.message || 'Error al afegir la despesa. Torna-ho a intentar.';
            this.showErrorMessage = true;
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  /**
   * Handles cancel button click
   * Requirements: 4.5
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Gets error message for a form field
   * Requirements: 4.3
   */
  getErrorMessage(fieldName: string): string {
    const control = this.expenseForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} és obligatori`;
    }

    if (control.errors['min']) {
      return `${this.getFieldLabel(fieldName)} ha de ser un nombre positiu`;
    }

    return 'Valor no vàlid';
  }

  /**
   * Gets human-readable label for field name
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nom',
      description: 'Descripció',
      issuer: 'Emissor',
      tag: 'Etiqueta',
      category: 'Categoria',
      approximateAmount: 'Import aproximat',
      scheduledPaymentDate: 'Data prevista de pagament',
      actualPaymentDate: 'Data real de pagament',
      actualAmount: 'Import real',
      paymentStatus: 'Estat del pagament',
      bank: 'Banc',
      periodicity: 'Periodicitat',
      fraction: 'Fracció'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Gets human-readable label for payment status
   */
  getStatusLabel(status: PaymentStatus): string {
    const labels: { [key in PaymentStatus]: string } = {
      'PENDING': 'Pendent',
      'PAID': 'Pagat',
      'FAILED': 'Fallat'
    };
    return labels[status] || status;
  }

  /**
   * Gets human-readable label for periodicity
   */
  getPeriodicityLabel(periodicity: Periodicity): string {
    const labels: { [key in Periodicity]: string } = {
      'MENSUAL': 'Mensual',
      'BIMENSUAL': 'Bimensual',
      'TRIMESTRAL': 'Trimestral',
      'ANUAL': 'Anual'
    };
    return labels[periodicity] || periodicity;
  }

  /**
   * Gets human-readable label for fraction
   */
  getFractionLabel(fraction: Fraction): string {
    const labels: { [key in Fraction]: string } = {
      'ÚNICA': 'Única',
      'PRIMERA': 'Primera',
      'SEGONA': 'Segona',
      'TERCERA': 'Tercera',
      'QUARTA': 'Quarta'
    };
    return labels[fraction] || fraction;
  }
}
