import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DatabaseService, Movement, Account } from '../../services/database.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());
  
  months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];
  
  years = signal<number[]>([]);

  totalBalance = signal(0);
  totalRevenue = signal(0);
  totalExpense = signal(0);

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
  };
  public pieChartLabels: string[] = [];
  public pieChartDatasets = [{
    data: [] as number[],
    backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']
  }];
  public pieChartLegend = true;
  public pieChartPlugins = [];

  // Line Chart for Evolution
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' }
      },
      x: {
        grid: { display: false }
      }
    }
  };
  public lineChartLabels: string[] = [];
  public lineChartDatasets: ChartConfiguration<'line'>['data']['datasets'] = [
    {
      data: [],
      label: 'Gastos',
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6'
    }
  ];

  constructor(private db: DatabaseService) { }

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.years.set([currentYear - 2, currentYear - 1, currentYear, currentYear + 1]);
    this.loadData();
  }

  async loadData() {
    const monthStr = `${this.selectedYear()}-${this.selectedMonth().toString().padStart(2, '0')}`;
    
    const accounts = await this.db.getAccounts();
    this.totalBalance.set(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0));

    const categories = await this.db.getCategories();
    const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

    let expensesByCategory: { [key: string]: number } = {};
    let revenues = 0;
    let expenses = 0;

    for (const acc of accounts) {
      if (acc.id) {
        const movs = await this.db.getMovements(acc.id, monthStr);
        movs.forEach(m => {
          if (m.type === 'C') {
            revenues += m.amount;
          } else if (m.type === 'D') {
            expenses += Math.abs(m.amount);
            const catName = m.category_id ? (categoryNameMap.get(m.category_id) || 'Outros') : 'Outros';
            expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Math.abs(m.amount);
          }
        });
      }
    }

    this.totalRevenue.set(revenues);
    this.totalExpense.set(expenses);
    this.pieChartLabels = Object.keys(expensesByCategory);
    this.pieChartDatasets = [{
      data: Object.values(expensesByCategory),
      backgroundColor: this.pieChartDatasets[0].backgroundColor
    }];

    await this.loadEvolutionData(accounts);
  }

  async loadEvolutionData(accounts: Account[]) {
    // Get data for the last 6 months
    const now = new Date(this.selectedYear(), this.selectedMonth() - 1, 1);
    const labels: string[] = [];
    const points: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));

      let monthlyExpense = 0;
      for (const acc of accounts) {
        if (acc.id) {
          const movs = await this.db.getMovements(acc.id, period);
          monthlyExpense += movs
            .filter(m => m.type === 'D')
            .reduce((sum, m) => sum + Math.abs(m.amount), 0);
        }
      }
      points.push(monthlyExpense);
    }

    this.lineChartLabels = labels;
    this.lineChartDatasets = [{
      ...this.lineChartDatasets[0],
      data: points
    }];
  }

  onPeriodChange() {
    this.loadData();
  }
}
