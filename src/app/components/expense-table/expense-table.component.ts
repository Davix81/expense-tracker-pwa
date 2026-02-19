import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Expense } from '../../models/expense.model';

/**
 * ExpenseTableComponent displays expenses in a sortable, filterable Material table
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './expense-table.component.html',
  styleUrl: './expense-table.component.scss'
})
export class ExpenseTableComponent implements OnInit, OnChanges {
  @Input() expenses: Expense[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Output() edit = new EventEmitter<Expense>();
  @Output() delete = new EventEmitter<Expense>();
  @Output() yearChange = new EventEmitter<number>();
  @Output() monthChange = new EventEmitter<number>();
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Expense>();
  availableYears: number[] = [];
  availableMonths: number[] = [];
  availableTags: string[] = [];
  selectedTags: Set<string> = new Set();
  selectedMonth: number = 0; // 0 = Todos los meses

  // Define all table columns including actions
  displayedColumns: string[] = [
    'name',
    'description',
    'issuer',
    'tag',
    'category',
    'approximateAmount',
    'scheduledPaymentDate',
    'periodicity',
    'actualPaymentDate',
    'actualAmount',
    'paymentStatus',
    'bank',
    'actions'
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize dataSource with expenses
    this.updateDataSource();
  }

  ngAfterViewInit(): void {
    // Set sort after view initialization
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update dataSource when expenses or selectedYear input changes
    if (changes['expenses'] || changes['selectedYear']) {
      this.updateDataSource();
    }
  }

  private updateDataSource(): void {
    // Calculate available years and months
    const years = new Set<number>();
    const months = new Set<number>();
    const tags = new Set<string>();
    
    this.expenses.forEach(expense => {
      const date = new Date(expense.scheduledPaymentDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      
      years.add(year);
      
      // Only add months for the selected year
      if (year === this.selectedYear) {
        months.add(month);
      }
      
      if (expense.tag && expense.tag.trim() !== '') {
        tags.add(expense.tag);
      }
    });
    
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    this.availableMonths = Array.from(months).sort((a, b) => a - b);
    this.availableTags = Array.from(tags).sort();

    // Filter expenses by selected year, month and tags
    const filtered = this.expenses.filter(expense => {
      const date = new Date(expense.scheduledPaymentDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const yearMatch = year === this.selectedYear;
      const monthMatch = this.selectedMonth === 0 || month === this.selectedMonth;
      
      // Si no hay tags seleccionados, mostrar todos
      if (this.selectedTags.size === 0) {
        return yearMatch && monthMatch;
      }
      
      // Si hay tags seleccionados, el gasto debe tener al menos uno de ellos
      return yearMatch && monthMatch && expense.tag && this.selectedTags.has(expense.tag);
    });

    this.dataSource.data = filtered;
    this.cdr.detectChanges();
  }

  onYearChange(year: number): void {
    this.selectedMonth = 0; // Reset month when year changes
    this.yearChange.emit(year);
  }

  onMonthChange(month: number): void {
    this.selectedMonth = month;
    this.updateDataSource();
    this.monthChange.emit(month);
  }

  getMonthName(month: number): string {
    if (month === 0) return 'Tots els mesos';
    
    const monthNames = [
      'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
      'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
    ];
    return monthNames[month - 1];
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.updateDataSource();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.has(tag);
  }

  clearTagFilters(): void {
    this.selectedTags.clear();
    this.updateDataSource();
  }

  /**
   * Apply filter to the table based on user input
   * Filters across all expense attributes
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Get CSS class for payment status badge
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      default:
        return '';
    }
  }

  /**
   * Emit edit event
   */
  onEdit(expense: Expense): void {
    this.edit.emit(expense);
  }

  /**
   * Emit delete event
   */
  onDelete(expense: Expense): void {
    this.delete.emit(expense);
  }

  /**
   * Get filtered data for display
   */
  get filteredExpenses(): Expense[] {
    return this.dataSource.filteredData || this.dataSource.data || [];
  }

  /**
   * Get human-readable label for periodicity
   */
  getPeriodicityLabel(periodicity: string): string {
    const labels: { [key: string]: string } = {
      'MENSUAL': 'Mensual',
      'BIMENSUAL': 'Bimensual',
      'TRIMESTRAL': 'Trimestral',
      'ANUAL': 'Anual'
    };
    return labels[periodicity] || periodicity;
  }
}
