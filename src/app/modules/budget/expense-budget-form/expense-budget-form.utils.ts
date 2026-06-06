import type { Budget, NewBudget } from '../../../models';

export interface ExpenseBudgetFormValue {
  categoryId: string;
  amountLimit: number;
  targetKind: 'maximum' | 'minimum';
  alertPercent: number;
  notes: string;
}

export function buildExpenseBudgetPayload(
  raw: ExpenseBudgetFormValue,
  options: { budget?: Budget; month: number; year: number },
): NewBudget {
  return {
    categoryId: raw.categoryId,
    amountLimit: Number(raw.amountLimit),
    targetKind: raw.targetKind,
    alertPercent: Number(raw.alertPercent) || 80,
    notes: raw.notes.trim() || null,
    periodMonth: options.budget?.periodMonth ?? options.month,
    periodYear: options.budget?.periodYear ?? options.year,
  };
}
