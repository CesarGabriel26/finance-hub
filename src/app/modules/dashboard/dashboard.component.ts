import { Component, OnInit, signal, ChangeDetectorRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { AccountService } from '../../services/account.service';
import { CategoryService } from '../../services/category.service';
import { Movement, Account, Category, Budget, Insight } from '../../models/database.models';
import { LucideAngularModule, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Filter, Search, List, Activity, AlertCircle, Lightbulb, Calculator, Flame } from 'lucide-angular';
import { BudgetService } from '../../services/budget.service';
import { SimulatorModalComponent } from '../../components/simulator-modal/simulator-modal.component';
import { SettingsService } from '../../services/settings.service';
import { BillService } from '../../services/bill.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule, SimulatorModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  budgetService = inject(BudgetService)


  // Config
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly DollarSign = DollarSign;
  readonly Wallet = Wallet;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ArrowDownRight = ArrowDownRight;
  readonly Filter = Filter;
  readonly Search = Search;
  readonly List = List;
  readonly Activity = Activity;
  readonly AlertCircle = AlertCircle;
  readonly Lightbulb = Lightbulb;
  readonly CalculatorIcon = Calculator;
  readonly Flame = Flame;
  readonly Math = Math;

  // Beginner Mode State
  settingsService = inject(SettingsService);
  isBeginnerMode = () => this.settingsService.settings()['beginner_mode'] === true;
  isSimulatorOpen = signal(false);
  expenseVariations = signal<any[]>([]);
  dailySafeLimit = signal(0);
  currentStreak = signal(0);

  // Pots for Beginner Mode
  potSurvival = signal(0);
  potPleasure = signal(0);
  potFuture = signal(0);

  // Period
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];
  years = signal<number[]>([]);

  // Filters
  filterType = signal<'ALL' | 'C' | 'D'>('ALL');
  filterAccountId = signal<number | null>(null);
  filterCategoryId = signal<number | null>(null);

  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);

  // Loading
  isLoading = signal(true);

  // Totals current
  totalBalance = signal(0);
  totalRevenue = signal(0);
  totalExpense = signal(0);

  // Totals preview
  prevTotalRevenue = signal(0);
  prevTotalExpense = signal(0);

  // Advanced Data
  insights = signal<Insight[]>([]);
  prediction7d = signal(0);
  prediction30d = signal(0);
  budgets = signal<Budget[]>([]);
  processedData = signal<any>(null);

  // Recent Movements
  recentMovements = signal<Movement[]>([]);

  // Evolution Config
  evolutionPeriod = signal<6 | 12>(6);

  // PIE EXPENSE
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.label || '';
            if (label) label += ': ';
            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed || 0);
            return label;
          }
        }
      }
    }
  };
  public pieChartLabels: string[] = [];
  public pieChartDatasets = [{
    data: [] as number[],
    backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#D946EF', '#F43F5E']
  }];
  public pieChartLegend = true;

  // LINE EXPENSE
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return 'Gastos: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y || 0);
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F8FAFC' } },
      x: { grid: { display: false } }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };
  public lineChartLabels: string[] = [];
  public lineChartDatasets: ChartConfiguration<'line'>['data']['datasets'] = [
    {
      data: [],
      label: 'Gastos',
      borderColor: '#EF4444', // danger
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.5,
      pointBackgroundColor: '#EF4444',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#EF4444',
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ];

  // PIE REVENUE
  public pieChartRevenueOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.label || '';
            if (label) label += ': ';
            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed || 0);
            return label;
          }
        }
      }
    }
  };
  public pieChartRevenueLabels: string[] = [];
  public pieChartRevenueDatasets = [{
    data: [] as number[],
    backgroundColor: ['#22C55E', '#10B981', '#34D399', '#059669', '#047857', '#6EE7B7', '#064E3B', '#022C22', '#A7F3D0', '#3B82F6']
  }];
  public pieChartRevenueLegend = true;

  // LINE REVENUE
  public lineChartRevenueOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return 'Receitas: ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y || 0);
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F8FAFC' } },
      x: { grid: { display: false } }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };
  public lineChartRevenueLabels: string[] = [];
  public lineChartRevenueDatasets: ChartConfiguration<'line'>['data']['datasets'] = [
    {
      data: [],
      label: 'Receitas',
      borderColor: '#22C55E', // success
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.5,
      pointBackgroundColor: '#22C55E',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#22C55E',
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    private billService: BillService
  ) { }

  async ngOnInit(): Promise<void> {
    const currentYear = new Date().getFullYear();
    this.years.set([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);

    // Load metadata for filters
    const accs = await this.accountService.getAccounts();
    this.accounts.set(accs);
    const cats = await this.categoryService.getCategories();
    this.categories.set(cats);

    await this.loadData();
  }

  getFilters() {
    const filters: any = {};
    if (this.filterAccountId()) filters.accountId = this.filterAccountId();
    if (this.filterCategoryId()) filters.categoryId = this.filterCategoryId();
    if (this.filterType() !== 'ALL') filters.type = this.filterType();
    return filters;
  }

  async loadData() {
    this.isLoading.set(true);
    this.cdr.detectChanges();

    try {
      const monthStr = `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}`;
      const filters = this.getFilters();

      // Get Aggregated Data
      const summary = await this.dashboardService.getAggregatedDashboardData(monthStr, filters);

      // Total balance
      let balance = 0;
      if (this.filterAccountId()) {
        const acc = this.accounts().find(a => a.id == this.filterAccountId());
        balance = acc?.balance || 0;
      } else {
        balance = this.accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0);
      }
      this.totalBalance.set(balance);

      // Set Signals
      this.totalRevenue.set(summary.revenues);
      this.totalExpense.set(summary.expenses);
      this.prevTotalRevenue.set(summary.prevRevenues);
      this.prevTotalExpense.set(summary.prevExpenses);

      this.insights.set(summary.insights);
      this.prediction7d.set(summary.prediction7d);
      this.prediction30d.set(summary.prediction30d);
      this.budgets.set(summary.budgets);
      this.expenseVariations.set(summary.expenseVariations || []);
      this.processedData.set(summary);

      // Beginner Mode Logic: Daily Limit
      const now = new Date();
      const isCurrentMonth = this.selectedYear() === now.getFullYear() && this.selectedMonth() === (now.getMonth() + 1);
      const isFutureMonth = (this.selectedYear() > now.getFullYear()) || (this.selectedYear() === now.getFullYear() && this.selectedMonth() > (now.getMonth() + 1));

      if (isCurrentMonth || isFutureMonth) {
        const daysInMonth = new Date(this.selectedYear(), this.selectedMonth(), 0).getDate();
        const currentDay = isCurrentMonth ? now.getDate() : 1;
        const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

        // Custom formula requested by user
        const pendingBills = await this.billService.getBills('D', 'pending');
        const monthStart = new Date(this.selectedYear(), this.selectedMonth() - 1, 1);
        const monthEnd = new Date(this.selectedYear(), this.selectedMonth(), 0);
        
        const contasObrigatorias = pendingBills
          .filter(b => {
            const dueDate = new Date(b.due_date);
            return dueDate >= monthStart && dueDate <= monthEnd && b.recurrence_classification === 'fixed';
          })
          .reduce((sum, b) => sum + b.amount, 0);

        const margemSeguranca = balance * 0.1; // 10% safety margin
        const saldoDisponivel = balance - contasObrigatorias - margemSeguranca;
        
        const safeDaily = Math.max(0, saldoDisponivel / remainingDays);
        this.dailySafeLimit.set(safeDaily);
      } else {
        this.dailySafeLimit.set(0);
      }

      // Visual Pots Calculation
      const fixedCategories = new Set(this.categories().filter(c => c.is_fixed).map(c => c.id));
      let survival = 0;
      let pleasure = 0;

      for (const catIdStr of Object.keys(summary.expensesByCategoryId)) {
        const id = Number(catIdStr);
        if (fixedCategories.has(id)) {
          survival += summary.expensesByCategoryId[id];
        } else {
          pleasure += summary.expensesByCategoryId[id];
        }
      }
      this.potSurvival.set(survival);
      this.potPleasure.set(pleasure);
      this.potFuture.set(this.totalBalance());

      // Pie Charts
      this.pieChartLabels = Object.keys(summary.expensesByCategory);
      this.pieChartDatasets = [{
        data: Object.values(summary.expensesByCategory),
        backgroundColor: this.pieChartDatasets[0].backgroundColor
      }];
      this.pieChartRevenueLabels = Object.keys(summary.revenuesByCategory);
      this.pieChartRevenueDatasets = [{
        data: Object.values(summary.revenuesByCategory),
        backgroundColor: this.pieChartRevenueDatasets[0].backgroundColor
      }];

      await this.loadEvolutionData(filters);

      // Recent Movements
      const f = { ...filters, period: monthStr };
      const recents = await this.dashboardService.getRecentMovements(15, f); // fetch more to calculate streak
      this.recentMovements.set(recents.slice(0, 6)); // show only 6 in UI 

      // Calculate streak (consecutive days without exceeding safe limits or just having no expenses)
      if (isCurrentMonth) {
        let streak = 0;
        let d = new Date();
        while (streak < 30) {
          const dateStr = d.toISOString().split('T')[0];
          const daysTotalD = recents.filter((m: Movement) => m.date === dateStr && m.type === 'D').reduce((s: number, m: Movement) => s + m.amount, 0);
          // Very simplified streak rule: didn't spend > dailySafeLimit or 50 BRL if daily limit is 0
          if (daysTotalD <= (this.dailySafeLimit() || 50)) {
            streak++;
          } else {
            break; // streak broke
          }
          d.setDate(d.getDate() - 1);
        }
        this.currentStreak.set(streak);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  async loadEvolutionData(filters: any) {
    const periodsCount = this.evolutionPeriod();
    const { labels, periods } = this.dashboardService.getEvolutionPeriods(this.selectedYear(), this.selectedMonth(), periodsCount);

    const evolutionData = await this.dashboardService.getDashboardEvolution(periods, filters);

    const pointsExpense = periods.map((p: string) => {
      const match = evolutionData.find((row: any) => row.period === p);
      return match ? match.total_expense : 0;
    });

    const pointsRevenue = periods.map((p: string) => {
      const match = evolutionData.find((row: any) => row.period === p);
      return match ? match.total_revenue : 0;
    });

    this.lineChartLabels = labels;
    this.lineChartDatasets = [{
      ...this.lineChartDatasets[0],
      data: pointsExpense
    }];

    this.lineChartRevenueLabels = labels;
    this.lineChartRevenueDatasets = [{
      ...this.lineChartRevenueDatasets[0],
      data: pointsRevenue
    }];
  }

  onFilterChange() {
    this.loadData();
  }

  onEvolutionPeriodChange(count: 6 | 12) {
    this.evolutionPeriod.set(count);
    this.loadData();
  }

  getVariation(current: number, previous: number): { value: number, isPositive: boolean, hasData: boolean } {
    if (!previous) return { value: 0, isPositive: true, hasData: false };
    const diff = current - previous;
    const perc = (diff / previous) * 100;
    return {
      value: Math.abs(perc),
      isPositive: perc >= 0,
      hasData: true
    };
  }

  expenseChartClicked(e: any): void {
    if (e.active && e.active.length > 0) {
      // Index of the clicked element
      const idx = e.active[0].index;
      const catName = this.pieChartLabels[idx];
      const cat = this.categories().find(c => c.name === catName && c.type === 'D');
      if (cat) {
        this.filterType.set('D');
        this.filterCategoryId.set(cat.id || null);
        this.loadData();
      }
    }
  }

  revenueChartClicked(e: any): void {
    if (e.active && e.active.length > 0) {
      const idx = e.active[0].index;
      const catName = this.pieChartRevenueLabels[idx];
      const cat = this.categories().find(c => c.name === catName && c.type === 'C');
      if (cat) {
        this.filterType.set('C');
        this.filterCategoryId.set(cat.id || null);
        this.loadData();
      }
    }
  }

  toggleBeginnerMode() {
    const newState = !this.isBeginnerMode();
    this.settingsService.updateSetting('beginner_mode', newState);
  }

  openSimulator() {
    this.isSimulatorOpen.set(true);
  }
}
