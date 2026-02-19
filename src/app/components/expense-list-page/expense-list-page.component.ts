import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ExpenseTableComponent } from '../expense-table/expense-table.component';
import { AddExpenseDialogComponent } from '../add-expense-dialog/add-expense-dialog.component';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { Expense } from '../../models/expense.model';
import { NotificationMessageComponent } from '../notification-message/notification-message.component';

/**
 * ExpenseListPage component - Main application view
 *
 * Requirements: 2.1, 2.3, 3.5
 */
@Component({
  selector: 'app-expense-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    ExpenseTableComponent,
    NotificationMessageComponent
  ],
  templateUrl: './expense-list-page.component.html',
  styleUrl: './expense-list-page.component.scss'
})
export class ExpenseListPageComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  expenses: Expense[] = [];
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  showErrorMessage: boolean = false;

  ngOnInit(): void {
    this.initializeYears();
    this.loadExpenses();
  }

  /**
   * Initialize available years
   */
  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  /**
   * Load expenses from the service
   * Requirements: 2.1
   */
  loadExpenses(): void {
    console.log('Loading expenses...');
    this.isLoading = true;
    this.showErrorMessage = false;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        console.log('Expenses loaded:', expenses.length);
        this.expenses = expenses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.errorMessage = 'No s\'han pogut carregar les despeses. Torna-ho a intentar.';
        this.showErrorMessage = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('Load expenses completed');
      }
    });
  }

  /**
   * Open the Add Expense dialog
   * Requirements: 3.5
   */
  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'expense-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh expense list after successful addition
        // Requirements: 2.3
        this.loadExpenses();
      }
    });
  }

  /**
   * Open the Edit Expense dialog
   */
  openEditDialog(expense: Expense): void {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'expense-dialog',
      data: { expense }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh expense list after successful update
        this.loadExpenses();
      }
    });
  }

  /**
   * Confirm and delete expense
   */
  confirmDelete(expense: Expense): void {
    if (confirm(`Estàs segur que vols eliminar la despesa "${expense.name}"?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.loadExpenses();
        },
        error: (error) => {
          this.errorMessage = 'No s\'ha pogut eliminar la despesa. Torna-ho a intentar.';
          this.showErrorMessage = true;
          console.error('Error deleting expense:', error);
        }
      });
    }
  }

  /**
   * Handle logout button click
   * Requirements: 3.5
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Handle year change from table
   */
  onYearChange(year: number): void {
    this.selectedYear = year;
  }
}
