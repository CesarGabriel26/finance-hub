import { autoCategorize } from '../../../utils/helpers/category-rule.helper';
import type {
  Account,
  AccountType,
  AiCategorizationRequest,
  AiCategorizationSuggestion,
  Category,
  CategoryRule,
  ImportedTransaction,
  NewTransaction,
  Transaction,
} from '../../../models';

export function matchCategoryForTransaction(
  transaction: ImportedTransaction,
  categories: Category[],
  categoryRules: CategoryRule[],
): { category: Category | undefined; source: ImportedTransaction['categorySource'] } {
  const description = normalizeText(
    `${transaction.descriptionNormalized || ''} ${transaction.description || ''} ${transaction.memo || ''}`,
  );
  const type = transaction.direction === 'credit' ? 'income' : 'expense';
  const rules = categoryRules
    .filter(rule => rule.categoryType === type || !rule.categoryType)
    .sort((a, b) => b.priority - a.priority || b.keyword.length - a.keyword.length);
  const rule = rules.find(candidate => description.includes(normalizeText(candidate.keyword)));

  if (rule) {
    return { category: categories.find(category => category.id === rule.categoryId), source: 'rule' };
  }

  const categoryName = autoCategorize(transaction.descriptionNormalized || transaction.description);
  const matchedByName = categories.find(category =>
    category.type === type &&
    normalizeText(category.name) === normalizeText(categoryName)
  );
  if (matchedByName) return { category: matchedByName, source: 'auto' };

  const fallbackName = type === 'income' ? 'Outras Receitas' : 'Outras Despesas';
  return {
    category: categories.find(category =>
      category.type === type &&
      normalizeText(category.name) === normalizeText(fallbackName)
    ),
    source: 'fallback',
  };
}

export function buildAiCategorizationRequest(
  categories: Category[],
  transactions: ImportedTransaction[],
): AiCategorizationRequest {
  return {
    categories: categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
    transactions: transactions.map(transaction => ({
      fitId: transaction.fitId,
      description: transaction.descriptionNormalized || transaction.description,
      originalDescription: transaction.description || null,
      memo: transaction.memo ?? null,
      amount: transaction.amountAbs ?? 0,
      direction: transaction.direction,
      date: dateFromTransaction(transaction),
    })),
  };
}

export function applyAiCategorizationSuggestions(
  transactions: ImportedTransaction[],
  suggestions: AiCategorizationSuggestion[],
  categories: Category[],
): { transactions: ImportedTransaction[]; applied: number } {
  const suggestionsByFitId = new Map(suggestions.map(suggestion => [suggestion.fitId, suggestion]));
  const validCategoryIds = new Set(categories.map(category => category.id));
  let applied = 0;

  const updatedTransactions = transactions.map(transaction => {
    const suggestion = suggestionsByFitId.get(transaction.fitId);

    if (!suggestion?.categoryId || !validCategoryIds.has(suggestion.categoryId)) {
      return transaction;
    }

    applied++;

    return {
      ...transaction,
      categoryId: suggestion.categoryId,
      suggestedCategoryId: suggestion.categoryId,
      categorySource: 'ai' as const,
    };
  });

  return { transactions: updatedTransactions, applied };
}

export function selectedImportTransactions(transactions: ImportedTransaction[]): ImportedTransaction[] {
  return transactions.filter(transaction => !transaction.ignored);
}

export function transactionFitIds(transactions: ImportedTransaction[]): string[] {
  return transactions
    .map(transaction => transaction.fitId)
    .filter((fitId): fitId is string => Boolean(fitId));
}

export function transactionFitIdSet(transactions: Transaction[]): Set<string> {
  return new Set(transactions.map(transaction => transaction.fitId).filter((fitId): fitId is string => Boolean(fitId)));
}

export function duplicateCountForTransactions(
  transactions: ImportedTransaction[],
  existingFitIds: Set<string>,
): number {
  return transactions.filter(transaction => transaction.fitId && existingFitIds.has(transaction.fitId)).length;
}

export function markDuplicateTransactions(
  transactions: ImportedTransaction[],
  existingFitIds: Set<string>,
): ImportedTransaction[] {
  return transactions.map(transaction => {
    const duplicate = Boolean(transaction.fitId && existingFitIds.has(transaction.fitId));

    return {
      ...transaction,
      duplicate,
      ignored: duplicate ? true : transaction.ignored,
    };
  });
}

export function buildImportPayload(
  transactions: ImportedTransaction[],
  accountId: string,
  existingFitIds: Set<string>,
): NewTransaction[] {
  return transactions
    .filter(transaction => !transaction.fitId || !existingFitIds.has(transaction.fitId))
    .map(transaction => ({
      accountId,
      categoryId: transaction.categoryId ?? null,
      description: transaction.descriptionNormalized || transaction.description,
      originalDescription: transaction.description || null,
      amount: transaction.amountAbs ?? 0,
      type: transaction.direction,
      date: dateFromTransaction(transaction) ?? new Date().toISOString().split('T')[0],
      ignored: false,
      fitId: transaction.fitId || null,
    }));
}

export function findStatementAccount(
  accounts: Account[],
  accountType: AccountType,
  bankCode: string,
  accountNumber: string,
  bankName: string,
): Account | undefined {
  const normalizedBankName = normalizeText(bankName);
  const candidates = accounts.filter(account => {
    const sameType = account.type === accountType;
    const sameBank = bankCode
      ? account.bankCode === bankCode
      : normalizeText(account.name).includes(normalizedBankName);

    return sameType && sameBank;
  });

  if (accountNumber) {
    const byNumber = candidates.find(account =>
      normalizeAccountNumber(account.accountNumber) === accountNumber
    );
    if (byNumber) return byNumber;
  }

  return candidates.find(account => !account.accountNumber) ?? candidates[0];
}

export function mapOfxAccountType(accountType: string | null): AccountType {
  const normalized = normalizeText(accountType);

  if (/sav|poup/.test(normalized)) return 'savings';
  if (/money|invest|broker|corret/.test(normalized)) return 'investment';

  return 'checking';
}

export function buildAccountName(bankName: string, accountType: AccountType, accountNumber: string): string {
  const suffix = accountNumber ? ` ${accountNumber}` : '';
  return `${bankName} - ${accountTypeLabel(accountType)}${suffix}`;
}

export function accountTypeLabel(accountType: AccountType): string {
  const labels: Record<AccountType, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupanca',
    cash: 'Dinheiro',
    investment: 'Investimentos',
  };

  return labels[accountType];
}

export function accountIcon(accountType: AccountType): string {
  const icons: Record<AccountType, string> = {
    checking: 'account_balance',
    savings: 'savings',
    cash: 'payments',
    investment: 'account_balance_wallet',
  };

  return icons[accountType];
}

export function accountColor(accountType: AccountType): string {
  const colors: Record<AccountType, string> = {
    checking: '#2563eb',
    savings: '#16a34a',
    cash: '#f59e0b',
    investment: '#7c3aed',
  };

  return colors[accountType];
}

export function normalizeAccountNumber(value?: string | null): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

export function toIsoDate(date: Date | null): string | null {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function periodFromDate(date: Date | null): string | null {
  return toIsoDate(date)?.slice(0, 7) ?? null;
}

export function dateFromTransaction(transaction: ImportedTransaction): string | null {
  if (!transaction.postedAt) return null;

  const date = new Date(transaction.postedAt as string);
  return Number.isNaN(date.getTime()) ? null : toIsoDate(date);
}
