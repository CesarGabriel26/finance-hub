import { Injectable } from '@angular/core';
import { Bill } from '../models/database.models';
import { HolidaysService } from './api/holidays.service';

export interface FinancialWindow {
  optimisticSafeDaily: number;
  realisticSafeDaily: number;
  daysToNextIncome: number;
  hasOptimisticIncome: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialWindowService {
  constructor(private holidaysService: HolidaysService) {}

  async calculateWindowMetrics(
    totalBalance: number,
    pendingRevenues: Bill[],
    pendingExpenses: Bill[],
    fixedCategoryIds: Set<number>,
    currentDate: Date = new Date()
  ): Promise<FinancialWindow> {
    // 1. Realistic Target: 5th business day of next month
    const realisticDate = await this.holidaysService.getFifthBusinessDayOfNextMonth(currentDate);
    
    // 2. Optimistic Target: First fixed income from today onwards
    let optimisticDate = new Date(realisticDate); // Default to realistic if none found
    let hasOptimisticIncome = false;

    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    const fixedRevenues = pendingRevenues
      .filter(bill => {
         const bDateStr = bill.due_date;
         const bDate = new Date(bDateStr + (bDateStr.includes('T') ? '' : 'T00:00:00'));
         const isFixed = bill.recurrence_classification === 'fixed' || (bill.category_id && fixedCategoryIds.has(bill.category_id));
         const isFutureOrToday = bDate >= todayStart;
         return bill.type === 'C' && isFixed && isFutureOrToday;
      })
      .sort((a, b) => {
         const dA = new Date(a.due_date + (a.due_date.includes('T') ? '' : 'T00:00:00'));
         const dB = new Date(b.due_date + (b.due_date.includes('T') ? '' : 'T00:00:00'));
         return dA.getTime() - dB.getTime();
      });

    if (fixedRevenues.length > 0) {
       optimisticDate = new Date(fixedRevenues[0].due_date + (fixedRevenues[0].due_date.includes('T') ? '' : 'T00:00:00'));
       hasOptimisticIncome = true;
    }

    const ONE_DAY = 1000 * 60 * 60 * 24;
    
    // Normalize time to noon to avoid daylight saving issues
    const currentNoon = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0);
    const realisticNoon = new Date(realisticDate.getFullYear(), realisticDate.getMonth(), realisticDate.getDate(), 12, 0, 0);
    const optimisticNoon = new Date(optimisticDate.getFullYear(), optimisticDate.getMonth(), optimisticDate.getDate(), 12, 0, 0);

    const realisticDaysRemaining = Math.max(1, Math.round((realisticNoon.getTime() - currentNoon.getTime()) / ONE_DAY));
    const optimisticDaysRemaining = Math.max(1, Math.round((optimisticNoon.getTime() - currentNoon.getTime()) / ONE_DAY));

    // Calculate essential bills for each window up to their specific target date
    const calculateEssentialBillsUntil = (targetDate: Date) => {
       const targetNoon = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0);
       return pendingExpenses.reduce((sum, bill) => {
         if (bill.type !== 'D') return sum;
         const dueDateStr = bill.due_date;
         const dueDate = new Date(dueDateStr + (dueDateStr.includes('T') ? '' : 'T00:00:00'));
         const isFixed = bill.recurrence_classification === 'fixed' || (bill.category_id && fixedCategoryIds.has(bill.category_id));
         const inPeriod = dueDate >= todayStart && dueDate <= targetNoon;
         return sum + (isFixed && inPeriod ? bill.amount : 0);
       }, 0);
    };

    const realisticBills = calculateEssentialBillsUntil(realisticDate);
    const optimisticBills = calculateEssentialBillsUntil(optimisticDate);

    const margemSeguranca = totalBalance * 0.1;

    const realisticSaldoDisponivel = totalBalance - realisticBills - margemSeguranca;
    const realisticSafeDaily = Math.max(0, realisticSaldoDisponivel / realisticDaysRemaining);

    const optimisticSaldoDisponivel = totalBalance - optimisticBills - margemSeguranca;
    const optimisticSafeDaily = Math.max(0, optimisticSaldoDisponivel / optimisticDaysRemaining);

    return {
       optimisticSafeDaily,
       realisticSafeDaily,
       daysToNextIncome: optimisticDaysRemaining,
       hasOptimisticIncome
    };
  }
}
