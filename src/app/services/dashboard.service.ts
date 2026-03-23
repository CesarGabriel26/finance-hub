import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Movement, Account, Category } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private db = inject(DatabaseService);

  async getDashboardData(period: string, filters?: any): Promise<any[]> {
    return this.db.handleApi<any[]>('getDashboardData', period, filters);
  }

  async getDashboardEvolution(periods: string[], filters?: any): Promise<any[]> {
    return this.db.handleApi<any[]>('getDashboardEvolution', periods, filters);
  }

  async getRecentMovements(limit: number = 5, filters?: any): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getRecentMovements', limit, filters);
  }

  processDashboardData(dbData: any[]) {
    let expensesByCategory: { [key: string]: number } = {};
    let revenuesByCategory: { [key: string]: number } = {};
    let revenues = 0;
    let expenses = 0;
    let highestCat = { name: '', amount: 0 };

    for (const row of dbData) {
      if (row.type === 'C') {
        revenues += row.total;
        const catName = row.category_name || 'Outros';
        revenuesByCategory[catName] = (revenuesByCategory[catName] || 0) + row.total;
      } else if (row.type === 'D') {
        expenses += row.total;
        const catName = row.category_name || 'Outros';
        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + row.total;
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
      highestCat
    };
  }

  generateInsights(expenses: number, prevExpenses: number, highestCat: { name: string, amount: number }) {
    let expenseTrendInsight = "Seus gastos estão estáveis.";
    if (prevExpenses > 0) {
      const increase = ((expenses - prevExpenses) / prevExpenses) * 100;
      if (increase > 5) {
        expenseTrendInsight = `Você gastou ${increase.toFixed(0)}% a mais este mês.`;
      } else if (increase < -5) {
        expenseTrendInsight = `Parabéns! Você economizou ${Math.abs(increase).toFixed(0)}% este mês.`;
      }
    }

    let topCategoryInsight = "";
    if (highestCat.name && expenses > 0) {
      const perc = (highestCat.amount / expenses) * 100;
      topCategoryInsight = `Maior gasto: ${highestCat.name} (${perc.toFixed(0)}% do total)`;
    } else {
      topCategoryInsight = `Nenhum gasto registrado neste mês.`;
    }

    return { expenseTrendInsight, topCategoryInsight };
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
