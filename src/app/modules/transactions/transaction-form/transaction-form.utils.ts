import type { NewTransaction, TransactionType } from '../../../models';

export interface TransactionFormValue {
  accountId: string;
  description: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string;
  tags: string;
}

export function buildTransactionPayload(raw: TransactionFormValue): NewTransaction {
  return {
    accountId: raw.accountId,
    description: raw.description.trim(),
    amount: Number(raw.amount),
    type: raw.type,
    date: raw.date,
    categoryId: raw.categoryId || null,
    tags: normalizeTags(raw.tags),
    ignored: false,
  };
}

export function normalizeTags(value: string): string {
  return value
    .split(',')
    .map(tag => tag.trim().replace(/^#/, ''))
    .filter(Boolean)
    .map(tag => `#${tag}`)
    .join(', ');
}
