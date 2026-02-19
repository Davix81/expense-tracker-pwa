import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';
import { AuthService } from '../../services/auth.service';

interface MonthlyExpense {
  month: string;
  paid: number;
  pending: number;
  count: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPageComponent implements OnInit {
   private readonly authService = inject(AuthService);
  expenses = signal<Expense[]>([]);
  selectedYear = signal<number>(new Date().getFullYear());
  availableYears = signal<number[]>([]);
  availableTags = signal<string[]>([]);
  selectedTags = signal<Set<string>>(new Set());
  
  // Computed signal para gastos filtrados por año y tags
  filteredExpenses = computed(() => {
    const year = this.selectedYear();
    const tags = this.selectedTags();
    
    return this.expenses().filter(expense => {
      const expenseYear = new Date(expense.scheduledPaymentDate).getFullYear();
      const yearMatch = expenseYear === year;
      
      // Si no hay tags seleccionados, mostrar todos
      if (tags.size === 0) {
        return yearMatch;
      }
      
      // Si hay tags seleccionados, el gasto debe tener al menos uno de ellos
      return yearMatch && expense.tag && tags.has(expense.tag);
    });
  });
  
  nextPayment = signal<Expense | null>(null);
  daysUntilNextPayment = signal<number>(0);
  
  // Estadísticas
  totalPaidThisMonth = signal<number>(0);
  totalPaidThisYear = signal<number>(0);
  totalPendingPayments = signal<number>(0);
  averageMonthlyExpense = signal<number>(0);
  mostExpensiveCategory = signal<string>('');
  pendingPaymentsCount = signal<number>(0);
  paidPaymentsCount = signal<number>(0);
  
  // Gráfico mensual (últimos 6 meses)
  monthlyChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{
      data: [],
      label: 'Gastos Mensuales',
      backgroundColor: 'rgba(63, 81, 181, 0.7)',
      borderColor: 'rgba(63, 81, 181, 1)',
      borderWidth: 1
    }]
  });

  // Gráfico por categoría
  categoryChartData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
      ]
    }]
  });

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems) => {
            const total = tooltipItems.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
            return `Total: ${total.toFixed(2)} €`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + ' €';
          }
        }
      }
    }
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  constructor(
    private expenseService: ExpenseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  logout(): void {
    this.authService.logout();
  }

  private loadExpenses(): void {
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.calculateAvailableYears(expenses);
        this.calculateAvailableTags(expenses);
        this.updateDashboard();
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
      }
    });
  }

  private calculateAvailableYears(expenses: Expense[]): void {
    const years = new Set<number>();
    expenses.forEach(expense => {
      const year = new Date(expense.scheduledPaymentDate).getFullYear();
      years.add(year);
    });
    
    // Ordenar años de más reciente a más antiguo
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    this.availableYears.set(sortedYears);
    
    // Si el año seleccionado no está en la lista, seleccionar el más reciente
    if (sortedYears.length > 0 && !sortedYears.includes(this.selectedYear())) {
      this.selectedYear.set(sortedYears[0]);
    }
  }

  private calculateAvailableTags(expenses: Expense[]): void {
    const tags = new Set<string>();
    expenses.forEach(expense => {
      if (expense.tag && expense.tag.trim() !== '') {
        tags.add(expense.tag);
      }
    });
    
    // Ordenar tags alfabéticamente
    const sortedTags = Array.from(tags).sort();
    this.availableTags.set(sortedTags);
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.updateDashboard();
  }

  toggleTag(tag: string): void {
    const currentTags = new Set(this.selectedTags());
    if (currentTags.has(tag)) {
      currentTags.delete(tag);
    } else {
      currentTags.add(tag);
    }
    this.selectedTags.set(currentTags);
    this.updateDashboard();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().has(tag);
  }

  clearTagFilters(): void {
    this.selectedTags.set(new Set());
    this.updateDashboard();
  }

  private updateDashboard(): void {
    const filtered = this.filteredExpenses();
    this.calculateNextPayment(filtered);
    this.calculateStatistics(filtered);
    this.generateMonthlyChart(filtered);
    this.generateCategoryChart(filtered);
  }

  private calculateStatistics(expenses: Expense[]): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Total pagado este mes
    const paidThisMonth = expenses
      .filter(e => {
        if (e.paymentStatus !== 'PAID' || !e.actualPaymentDate || !e.actualAmount) return false;
        const date = new Date(e.actualPaymentDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.actualAmount || 0), 0);
    this.totalPaidThisMonth.set(paidThisMonth);

    // Total pagado este año
    const paidThisYear = expenses
      .filter(e => {
        if (e.paymentStatus !== 'PAID' || !e.actualPaymentDate || !e.actualAmount) return false;
        const date = new Date(e.actualPaymentDate);
        return date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.actualAmount || 0), 0);
    this.totalPaidThisYear.set(paidThisYear);

    // Total de pagos pendientes
    const pendingTotal = expenses
      .filter(e => e.paymentStatus === 'PENDING')
      .reduce((sum, e) => sum + e.approximateAmount, 0);
    this.totalPendingPayments.set(pendingTotal);

    // Contadores de estado
    this.pendingPaymentsCount.set(expenses.filter(e => e.paymentStatus === 'PENDING').length);
    this.paidPaymentsCount.set(expenses.filter(e => e.paymentStatus === 'PAID').length);

    // Promedio mensual (últimos 6 meses)
    const monthlyData = this.getMonthlyExpenses(expenses, 6);
    const totalLast6Months = monthlyData.reduce((sum, m) => sum + m.paid, 0);
    const average = monthlyData.length > 0 ? totalLast6Months / monthlyData.length : 0;
    this.averageMonthlyExpense.set(average);

    // Categoría más cara
    const categoryTotals = new Map<string, number>();
    expenses
      .filter(e => e.paymentStatus === 'PAID' && e.actualAmount)
      .forEach(e => {
        const current = categoryTotals.get(e.category) || 0;
        categoryTotals.set(e.category, current + (e.actualAmount || 0));
      });

    let maxCategory = '';
    let maxAmount = 0;
    categoryTotals.forEach((amount, category) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxCategory = category;
      }
    });
    this.mostExpensiveCategory.set(maxCategory || 'N/A');
  }

  private calculateNextPayment(expenses: Expense[]): void {
    const now = new Date();
    const pendingExpenses = expenses
      .filter(e => e.paymentStatus === 'PENDING')
      .map(e => ({
        ...e,
        scheduledPaymentDate: new Date(e.scheduledPaymentDate)
      }))
      .filter(e => e.scheduledPaymentDate >= now)
      .sort((a, b) => a.scheduledPaymentDate.getTime() - b.scheduledPaymentDate.getTime());

    if (pendingExpenses.length > 0) {
      const next = pendingExpenses[0];
      this.nextPayment.set(next);
      const diffTime = next.scheduledPaymentDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.daysUntilNextPayment.set(diffDays);
    }
  }

  private generateMonthlyChart(expenses: Expense[]): void {
    const selectedYear = this.selectedYear();
    const monthlyData = this.getMonthlyExpensesForYear(expenses, selectedYear);
    
    this.monthlyChartData.set({
      labels: monthlyData.map(m => m.month),
      datasets: [
        {
          data: monthlyData.map(m => m.paid),
          label: 'Pagado (€)',
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          data: monthlyData.map(m => m.pending),
          label: 'Pendiente (€)',
          backgroundColor: 'rgba(255, 152, 0, 0.7)',
          borderColor: 'rgba(255, 152, 0, 1)',
          borderWidth: 1
        }
      ]
    });
  }

  private generateCategoryChart(expenses: Expense[]): void {
    const categoryTotals = new Map<string, number>();
    
    expenses
      .filter(e => e.paymentStatus === 'PAID' && e.actualAmount)
      .forEach(e => {
        const current = categoryTotals.get(e.category) || 0;
        categoryTotals.set(e.category, current + (e.actualAmount || 0));
      });

    const labels = Array.from(categoryTotals.keys());
    const data = Array.from(categoryTotals.values());

    this.categoryChartData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(201, 203, 207, 0.7)'
        ]
      }]
    });
  }

  private getMonthlyExpenses(expenses: Expense[], months: number): MonthlyExpense[] {
    const now = new Date();
    const monthlyMap = new Map<string, { paid: number; pending: number; count: number }>();

    // Inicializar últimos N meses
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { paid: 0, pending: 0, count: 0 });
    }

    // Procesar todos los gastos
    expenses.forEach(e => {
      let date: Date | null = null;
      let amount = 0;
      let isPaid = false;

      // Determinar la fecha y el monto según el estado
      if (e.paymentStatus === 'PAID' && e.actualPaymentDate && e.actualAmount) {
        date = new Date(e.actualPaymentDate);
        amount = e.actualAmount;
        isPaid = true;
      } else if (e.paymentStatus === 'PENDING') {
        date = new Date(e.scheduledPaymentDate);
        amount = e.approximateAmount;
        isPaid = false;
      }

      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          if (isPaid) {
            current.paid += amount;
          } else {
            current.pending += amount;
          }
          current.count += 1;
        }
      }
    });

    // Convertir a array
    return Array.from(monthlyMap.entries()).map(([key, value]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      
      return {
        month: label,
        paid: value.paid,
        pending: value.pending,
        count: value.count
      };
    });
  }

  private getMonthlyExpensesForYear(expenses: Expense[], year: number): MonthlyExpense[] {
    const monthlyMap = new Map<string, { paid: number; pending: number; count: number }>();

    // Inicializar los 12 meses del año seleccionado
    for (let month = 0; month < 12; month++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { paid: 0, pending: 0, count: 0 });
    }

    // Procesar todos los gastos
    expenses.forEach(e => {
      let date: Date | null = null;
      let amount = 0;
      let isPaid = false;

      // Determinar la fecha y el monto según el estado
      if (e.paymentStatus === 'PAID' && e.actualPaymentDate && e.actualAmount) {
        date = new Date(e.actualPaymentDate);
        amount = e.actualAmount;
        isPaid = true;
      } else if (e.paymentStatus === 'PENDING') {
        date = new Date(e.scheduledPaymentDate);
        amount = e.approximateAmount;
        isPaid = false;
      }

      if (date) {
        const expenseYear = date.getFullYear();
        const expenseMonth = date.getMonth();
        
        // Solo procesar gastos del año seleccionado
        if (expenseYear === year) {
          const key = `${expenseYear}-${String(expenseMonth + 1).padStart(2, '0')}`;
          
          if (monthlyMap.has(key)) {
            const current = monthlyMap.get(key)!;
            if (isPaid) {
              current.paid += amount;
            } else {
              current.pending += amount;
            }
            current.count += 1;
          }
        }
      }
    });

    // Convertir a array ordenado por mes
    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => {
        const [yearStr, monthStr] = key.split('-');
        const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const label = date.toLocaleDateString('es-ES', { month: 'short' });
        
        return {
          month: label,
          paid: value.paid,
          pending: value.pending,
          count: value.count
        };
      });
  }

  goToExpenses(): void {
    this.router.navigate(['/expenses']);
  }
}
