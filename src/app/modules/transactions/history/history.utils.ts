import type { DateRange } from '../../../components/date-range-input/date-range-input.component';
import type { Category, Transaction } from '../../../models';

export interface TransactionDayGroup {
  date: string;
  rows: Transaction[];
  total: number;
}

export interface TransactionHistoryFilters {
  filter?: string | null;
  account?: string | null;
  dateRange?: DateRange | null;
  type?: string | null;
}

export function buildTransactionHistoryQuery(
  filters: TransactionHistoryFilters,
): Record<string, unknown> | undefined {
  const payload: Record<string, unknown> = {};

  if (filters.filter) {
    payload['description'] = { like: filters.filter };
  }

  if (filters.account) {
    payload['accountId'] = { eq: filters.account };
  }

  if (filters.type) {
    payload['type'] = { eq: filters.type };
  }

  const range = filters.dateRange;
  if (range?.start && range?.end) {
    payload['date'] = { between: [range.start, range.end] };
  } else if (range?.start) {
    payload['date'] = { gte: range.start };
  } else if (range?.end) {
    payload['date'] = { lte: range.end };
  }

  return Object.keys(payload).length > 0 ? payload : undefined;
}

export function signedAmount(transaction: Transaction): number {
  if (transaction.type === 'debit') return -Math.abs(transaction.amount);
  return Math.abs(transaction.amount);
}

export function isIncome(transaction: Transaction): boolean {
  return signedAmount(transaction) > 0;
}

export function transactionTypeLabel(transaction: Transaction): string {
  const labels: Record<Transaction['type'], string> = {
    credit: 'Receita',
    debit: 'Despesa',
    transfer: 'Transferencia',
  };

  return labels[transaction.type];
}

export function transactionGroups(transactions: Transaction[]): TransactionDayGroup[] {
  const groups = new Map<string, Transaction[]>();

  [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(transaction => {
      const key = transaction.date.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), transaction]);
    });

  return [...groups.entries()].map(([date, rows]) => ({
    date,
    rows,
    total: rows.reduce((sum, transaction) => sum + signedAmount(transaction), 0),
  }));
}

export function totalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(transaction => signedAmount(transaction) > 0)
    .reduce((sum, transaction) => sum + signedAmount(transaction), 0);
}

export function totalExpense(transactions: Transaction[]): number {
  return transactions
    .filter(transaction => signedAmount(transaction) < 0)
    .reduce((sum, transaction) => sum + Math.abs(signedAmount(transaction)), 0);
}

export function transactionIcon(transaction: Transaction, category?: Category): string {
  if (transaction.type === 'transfer') return 'sync_alt';
  return category?.icon || (transaction.type === 'credit' ? 'add_circle' : 'remove_circle');
}

export function transactionColor(transaction: Transaction, category?: Category): string {
  if (transaction.type === 'transfer') return '#f5b70a';
  return category?.color || (transaction.type === 'credit' ? '#169b62' : '#dc3d35');
}
