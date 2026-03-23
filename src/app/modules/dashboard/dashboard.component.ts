import { Component, OnInit, signal, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { AccountService } from '../../services/account.service';
import { CategoryService } from '../../services/category.service';
import { Movement, Account, Category } from '../../models/database.models';
import { LucideAngularModule, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Filter, Search, List, Activity, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
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

  // Insights
  insightExpenseTrend = signal('');
  insightTopCategory = signal('');

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
    private accountService: AccountService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
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

      // Current Month
      const dbData = await this.dashboardService.getDashboardData(monthStr, filters);
      
      // Previous Month
      let pMonth = this.selectedMonth() - 1;
      let pYear = this.selectedYear();
      if (pMonth === 0) {
        pMonth = 12;
        pYear--;
      }
      const prevMonthStr = `${pYear}-${pMonth.toString().padStart(2, '0')}`;
      const prevDbData = await this.dashboardService.getDashboardData(prevMonthStr, filters);

      // Total balance (only considers account filter if set)
      let balance = 0;
      if (this.filterAccountId()) {
        const acc = this.accounts().find(a => a.id == this.filterAccountId());
        balance = acc?.balance || 0;
      } else {
        balance = this.accounts().reduce((sum, acc) => sum + (acc.balance || 0), 0);
      }
      this.totalBalance.set(balance);

      // Process Data
      const processed = this.dashboardService.processDashboardData(dbData);
      const prevProcessed = this.dashboardService.processDashboardData(prevDbData);

      this.totalRevenue.set(processed.revenues);
      this.totalExpense.set(processed.expenses);
      this.pieChartLabels = Object.keys(processed.expensesByCategory);
      this.pieChartDatasets = [{
        data: Object.values(processed.expensesByCategory),
        backgroundColor: this.pieChartDatasets[0].backgroundColor
      }];
      this.pieChartRevenueLabels = Object.keys(processed.revenuesByCategory);
      this.pieChartRevenueDatasets = [{
        data: Object.values(processed.revenuesByCategory),
        backgroundColor: this.pieChartRevenueDatasets[0].backgroundColor
      }];

      // Process Previous
      this.prevTotalRevenue.set(prevProcessed.revenues);
      this.prevTotalExpense.set(prevProcessed.expenses);

      // Generate Insights
      const insights = this.dashboardService.generateInsights(processed.expenses, prevProcessed.expenses, processed.highestCat);
      this.insightExpenseTrend.set(insights.expenseTrendInsight);
      this.insightTopCategory.set(insights.topCategoryInsight);

      await this.loadEvolutionData(filters);

      // Recent Movements
      const f = { ...filters, period: monthStr };
      const recents = await this.dashboardService.getRecentMovements(6, f);
      this.recentMovements.set(recents);

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

    const pointsExpense = periods.map(p => {
      const match = evolutionData.find(row => row.period === p);
      return match ? match.total_expense : 0;
    });

    const pointsRevenue = periods.map(p => {
      const match = evolutionData.find(row => row.period === p);
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
}
