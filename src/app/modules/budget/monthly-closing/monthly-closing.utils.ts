import type { Budget, InvestmentPortfolioAsset, Transaction } from '../../../models';
import { currentValue } from '../../investments/investment-calculations.util';

export function closingPeriod(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function closingPeriodRange(month: number, year: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  return { start, end };
}

export function incomeTotal(transactions: Transaction[]): number {
  return transactions
    .filter(transaction => transaction.type === 'credit' && !transaction.ignored)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function expenseTotal(transactions: Transaction[]): number {
  return transactions
    .filter(transaction => transaction.type === 'debit' && !transaction.ignored)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function budgetLimitTotal(budgets: Budget[]): number {
  return budgets.reduce((sum, budget) => sum + budget.amountLimit, 0);
}

export function budgetSpentTotal(budgets: Budget[], transactions: Transaction[]): number {
  return budgets.reduce((sum, budget) => {
    const spent = transactions
      .filter(transaction => transaction.categoryId === budget.categoryId && transaction.type === 'debit')
      .reduce((innerSum, transaction) => innerSum + Math.abs(transaction.amount), 0);

    return sum + spent;
  }, 0);
}

export function investedTotal(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + currentValue(asset), 0);
}
