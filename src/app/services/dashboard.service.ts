import { Injectable, inject, signal } from '@angular/core';
import { DatabaseService } from './database.service';
import { Movement, Account, Category, Budget, Insight } from '../models/database.models';
import { BudgetService } from './budget.service';
import { InsightService } from './insight.service';
import { PredictionService } from './prediction.service';
import { DataNotificationService } from './data-notification.service';

interface DashboardSummary {
  revenues: number;
  expenses: number;
  expensesByCategory: { [key: string]: number };
  revenuesByCategory: { [key: string]: number };
  expensesByCategoryId: { [key: number]: number };
  revenuesByCategoryId: { [key: number]: number };
  highestCat: { name: string, amount: number };
  prevExpenses: number;
  prevRevenues: number;
  budgets: Budget[];
  insights: Insight[];
  prediction7d: number;
  prediction30d: number;
  expenseVariations?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private db = inject(DatabaseService);
  private budgetService = inject(BudgetService);
  private insightService = inject(InsightService);
  private predictionService = inject(PredictionService);
  private dataNotification = inject(DataNotificationService);

  constructor() {
    // Listen for data changes to invalidate cache
    this.dataNotification.dataChange$.subscribe(() => {
      this.invalidateCache();
    });
  }

  private monthlyCache: Record<string, DashboardSummary> = {};

  async getDashboardData(period: string, filters?: any): Promise<any[]> {
    return this.db.handleApi<any[]>('getDashboardData', period, filters);
  }

  async getDashboardEvolution(periods: string[], filters?: any): Promise<any[]> {
    return this.db.handleApi<any[]>('getDashboardEvolution', periods, filters);
  }

  async getRecentMovements(limit: number = 5, filters?: any): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getRecentMovements', limit, filters);
  }

  async getAggregatedDashboardData(period: string, filters?: any): Promise<DashboardSummary> {
    const cacheKey = `${period}-${filters?.accountId || 'all'}`;
    if (this.monthlyCache[cacheKey]) {
      return this.monthlyCache[cacheKey];
    }

    const [year, month] = period.split('-').map(Number);
    const dbData = await this.getDashboardData(period, filters);
    
    // Get previous month data for trends
    const prevDate = new Date(year, month - 2, 1);
    const prevPeriod = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const prevDbData = await this.getDashboardData(prevPeriod, filters);

    const processed = this.processDashboardData(dbData);
    const prevProcessed = this.processDashboardData(prevDbData);
    
    const budgets = await this.budgetService.getBudgets(month, year);
    const insights = await this.insightService.generateInsights(period, { ...processed, prevExpenses: prevProcessed.expenses });
    const prediction7d = await this.predictionService.getPredictiveBalance(7);
    const prediction30d = await this.predictionService.getPredictiveBalance(30);
    const expenseVariations = await this.insightService.explainExpenseVariation(processed, prevProcessed);

    const summary: DashboardSummary = {
      ...processed,
      prevExpenses: prevProcessed.expenses,
      prevRevenues: prevProcessed.revenues,
      budgets,
      insights,
      prediction7d,
      prediction30d,
      expenseVariations
    };

    this.monthlyCache[cacheKey] = summary;
    return summary;
  }

  invalidateCache() {
    this.monthlyCache = {};
  }

  processDashboardData(dbData: any[]) {
    let expensesByCategory: { [key: string]: number } = {};
    let revenuesByCategory: { [key: string]: number } = {};
    let expensesByCategoryId: { [key: number]: number } = {};
    let revenuesByCategoryId: { [key: number]: number } = {};
    let revenues = 0;
    let expenses = 0;
    let highestCat = { name: '', amount: 0 };

    for (const row of dbData) {
      if (row.type === 'C') {
        revenues += row.total;
        const catName = row.category_name || 'Outros';
        revenuesByCategory[catName] = (revenuesByCategory[catName] || 0) + row.total;
        if (row.category_id) revenuesByCategoryId[row.category_id] = (revenuesByCategoryId[row.category_id] || 0) + row.total;
      } else if (row.type === 'D') {
        expenses += row.total;
        const catName = row.category_name || 'Outros';
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + row.total;
        if (row.category_id) expensesByCategoryId[row.category_id] = (expensesByCategoryId[row.category_id] || 0) + row.total;
        if (row.total > highestCat.amount) {
          highestCat = { name: catName, amount: row.total };
        }
      }
    }

    return {
      revenues,
      expenses,
      expensesByCategory,
      revenuesByCategory,
      expensesByCategoryId,
      revenuesByCategoryId,
      highestCat
    };
  }

  getEvolutionPeriods(selectedYear: number, selectedMonth: number, periodsCount: number) {
    const now = new Date(selectedYear, selectedMonth - 1, 1);
    const labels: string[] = [];
    const periods: string[] = [];

    for (let i = periodsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      labels.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
      periods.push(period);
    }

    return { labels, periods };
  }
}
