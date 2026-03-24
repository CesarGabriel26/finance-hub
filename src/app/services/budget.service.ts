import { Injectable, inject, signal } from '@angular/core';
import { DatabaseService } from './database.service';
import { Budget, Movement } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private db = inject(DatabaseService);

  async getBudgets(month?: number, year?: number): Promise<Budget[]> {
    return this.db.handleApi<Budget[]>('getBudgets', month, year);
  }

  async addBudget(budget: Partial<Budget>): Promise<any> {
    return this.db.handleApi('addBudget', budget);
  }

  async deleteBudget(id: number): Promise<any> {
    return this.db.handleApi('deleteBudget', id);
  }

  calculateStatus(spent: number, limit: number, threshold: number = 80): 'safe' | 'warning' | 'exceeded' {
    if (!limit || limit <= 0) return 'safe';
    const percent = (spent / limit) * 100;
    if (percent > 100) return 'exceeded';
    if (percent >= threshold) return 'warning';
    return 'safe';
  }

  getBudgetStatusColor(spent: number, limit: number, threshold: number = 80): string {
    const status = this.calculateStatus(spent, limit, threshold);
    switch (status) {
      case 'exceeded': return 'text-rose-600';
      case 'warning': return 'text-amber-500';
      case 'safe': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  }

  getBudgetProgressColor(spent: number, limit: number, threshold: number = 80): string {
    const status = this.calculateStatus(spent, limit, threshold);
    switch (status) {
      case 'exceeded': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      case 'safe': return 'bg-emerald-500';
      default: return 'bg-gray-200';
    }
  }
}
