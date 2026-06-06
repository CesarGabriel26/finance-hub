import type { Budget, Transaction } from '../../../models';

export function budgetPeriodRange(month: number, year: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);

  return { start, end };
}

export function spentInBudget(budget: Budget, transactions: Transaction[]): number {
  return transactions
    .filter(transaction => transaction.categoryId === budget.categoryId)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function remainingBudgetAmount(budget: Budget, transactions: Transaction[]): number {
  const spent = spentInBudget(budget, transactions);

  return budget.targetKind === 'minimum'
    ? spent - budget.amountLimit
    : budget.amountLimit - spent;
}

export function budgetProgress(budget: Budget, transactions: Transaction[]): number {
  if (budget.amountLimit <= 0) return 0;
  return Math.min(100, (spentInBudget(budget, transactions) / budget.amountLimit) * 100);
}

export function budgetProgressClass(budget: Budget, transactions: Transaction[]): string {
  const progress = budgetProgress(budget, transactions);
  if (budget.targetKind === 'minimum') {
    if (progress >= 100) return 'bg-emerald-600';
    if (progress >= budget.alertPercent) return 'bg-amber-500';
    return 'bg-red-600';
  }

  if (progress >= 100) return 'bg-red-600';
  if (progress >= budget.alertPercent) return 'bg-amber-500';
  return 'bg-emerald-600';
}

export function budgetTargetLabel(budget: Budget): string {
  return budget.targetKind === 'minimum' ? 'Meta minima' : 'Limite';
}

export function budgetBalanceLabel(budget: Budget): string {
  return budget.targetKind === 'minimum' ? 'Progresso' : 'Saldo';
}
