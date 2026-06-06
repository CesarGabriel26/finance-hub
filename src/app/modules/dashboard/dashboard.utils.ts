import type {
  Account,
  AccountPayable,
  AccountReceivable,
  AccountStatementBalance,
  Budget,
  Category,
  Transaction,
} from '../../models';

export interface MonthFlow {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number | null;
}

export interface BudgetInsight {
  budget: Budget;
  category?: Category;
  spent: number;
  progress: number;
}

export interface UpcomingEntry {
  id: string;
  kind: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: string;
  status: string;
}

export interface AccountSummaryRow {
  account: Account;
  balance: number;
}

export interface DailyExpensePoint {
  key: string;
  label: string;
  amount: number;
}

export type DashboardTrendRange = '7d' | '30d' | '6m' | '12m' | '3y';
export type PendingTab = 'payable' | 'receivable';

export interface TrendPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface CategoryAmountRow {
  category?: Category;
  amount: number;
  percent: number;
}

export function accountCurrentBalance(
  account: Account,
  statementBalances: AccountStatementBalance[],
): number {
  return latestStatementBalance(account.id, statementBalances)?.finalBalance ?? account.balance ?? 0;
}

export function accountRows(
  accounts: Account[],
  statementBalances: AccountStatementBalance[],
): AccountSummaryRow[] {
  return accounts
    .map(account => ({ account, balance: accountCurrentBalance(account, statementBalances) }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

export function totalAccountBalance(
  accounts: Account[],
  statementBalances: AccountStatementBalance[],
): number {
  return accounts.reduce((sum, account) => sum + accountCurrentBalance(account, statementBalances), 0);
}

export function monthTransactions(transactions: Transaction[]): Transaction[] {
  const start = currentMonthStart();
  const end = currentMonthEnd();
  return transactions.filter(transaction => {
    const date = transaction.date.slice(0, 10);
    return date >= start && date <= end && !transaction.ignored;
  });
}

export function monthIncome(transactions: Transaction[]): number {
  return sumTransactionsByType(monthTransactions(transactions), 'credit');
}

export function monthExpense(transactions: Transaction[]): number {
  return sumTransactionsByType(monthTransactions(transactions), 'debit');
}

export function budgetInsights(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
): BudgetInsight[] {
  const currentMonthTransactions = monthTransactions(transactions);

  return budgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(transaction => transaction.type === 'debit' && transaction.categoryId === budget.categoryId)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      budget,
      category: categories.find(category => category.id === budget.categoryId),
      spent,
      progress: budget.amountLimit > 0 ? Math.min(100, (spent / budget.amountLimit) * 100) : 0,
    };
  }).sort((a, b) => b.progress - a.progress);
}

export function upcomingEntries(
  payables: AccountPayable[],
  receivables: AccountReceivable[],
): UpcomingEntry[] {
  const payableEntries = payables
    .filter(item => item.status === 'pending' || item.status === 'overdue')
    .map(item => ({
      id: item.id,
      kind: 'payable' as const,
      description: item.description,
      amount: item.amount,
      dueDate: item.dueDate,
      status: item.status,
    }));

  const receivableEntries = receivables
    .filter(item => item.status === 'pending' || item.status === 'overdue')
    .map(item => ({
      id: item.id,
      kind: 'receivable' as const,
      description: item.description,
      amount: item.amount,
      dueDate: item.dueDate,
      status: item.status,
    }));

  return [...payableEntries, ...receivableEntries]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function openReceivableAmount(receivables: AccountReceivable[]): number {
  return receivables
    .filter(item => item.status === 'pending' || item.status === 'overdue')
    .reduce((sum, item) => sum + item.amount, 0);
}

export function openPayableAmount(payables: AccountPayable[]): number {
  return payables
    .filter(item => item.status === 'pending' || item.status === 'overdue')
    .reduce((sum, item) => sum + item.amount, 0);
}

export function overduePayablesAmount(payables: AccountPayable[]): number {
  const today = todayKey();
  return payables
    .filter(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate < today)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function monthFlow(
  accounts: Account[],
  transactions: Transaction[],
  statementBalances: AccountStatementBalance[],
): MonthFlow[] {
  return lastMonths(6).map(({ key, label }) => {
    const rows = transactions.filter(transaction => transaction.date.slice(0, 7) === key);
    const income = sumTransactionsByType(rows, 'credit');
    const expense = sumTransactionsByType(rows, 'debit');

    return {
      key,
      label,
      income,
      expense,
      net: income - expense,
      balance: totalBalanceAtPeriodEnd(accounts, transactions, statementBalances, key),
    };
  });
}

export function categorySpending(
  categories: Category[],
  transactions: Transaction[],
  type: Category['type'],
): CategoryAmountRow[] {
  const currentMonthTransactions = monthTransactions(transactions);
  const total = sumTransactionsByType(currentMonthTransactions, type === 'income' ? 'credit' : 'debit');
  const transactionType = type === 'income' ? 'credit' : 'debit';
  const rows = categories
    .filter(category => category.type === type)
    .map(category => {
      const amount = currentMonthTransactions
        .filter(transaction => transaction.type === transactionType && transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      return {
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      };
    })
    .filter(row => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return rows.length > 0 ? rows : [{ category: undefined, amount: 0, percent: 0 }];
}

export function dailyExpensePoints(transactions: Transaction[]): DailyExpensePoint[] {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    const key = dateKey(date);
    const amount = transactions
      .filter(transaction => !transaction.ignored && transaction.type === 'debit' && transaction.date.slice(0, 10) === key)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
      amount,
    };
  });
}

export function trendPoints(transactions: Transaction[], range: DashboardTrendRange): TrendPoint[] {
  if (range === '7d') return dayTrendPoints(transactions, 7);
  if (range === '30d') return dayTrendPoints(transactions, 30);
  if (range === '6m') return monthTrendPoints(transactions, 6);
  if (range === '12m') return monthTrendPoints(transactions, 12);
  return yearTrendPoints(transactions, 3);
}

export function projectedBalanceInDays(
  totalBalance: number,
  payables: AccountPayable[],
  receivables: AccountReceivable[],
  daysAhead: number,
): number {
  const today = todayKey();
  const limit = dateKeyFromOffset(daysAhead);
  const receivable = receivables
    .filter(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate >= today && item.dueDate <= limit)
    .reduce((sum, item) => sum + item.amount, 0);
  const payable = payables
    .filter(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate >= today && item.dueDate <= limit)
    .reduce((sum, item) => sum + item.amount, 0);

  return totalBalance + receivable - payable;
}

export function currentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function currentMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function dateKeyFromOffset(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return dateKey(date);
}

export function sumTransactionsByType(transactions: Transaction[], type: Transaction['type']): number {
  return transactions
    .filter(transaction => transaction.type === type)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}

export function signedTransactionForAccount(transaction: Transaction, accountId: string): number {
  const amount = Math.abs(transaction.amount);

  if (transaction.type === 'transfer') {
    if (transaction.transferAccountId === accountId) return amount;
    if (transaction.accountId === accountId) return -amount;
    return 0;
  }

  if (transaction.accountId !== accountId) return 0;
  return transaction.type === 'debit' ? -amount : amount;
}

export function statementReferenceDate(balance: AccountStatementBalance): string {
  return balance.statementEndDate ?? periodEndDate(balance.period);
}

export function periodEndDate(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

export function lastMonths(count: number): Array<{ key: string; label: string }> {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: formatter.format(date).replace('.', ''),
    };
  });
}

function latestStatementBalance(
  accountId: string,
  statementBalances: AccountStatementBalance[],
): AccountStatementBalance | undefined {
  return statementBalances
    .filter(balance => balance.accountId === accountId && balance.finalBalance !== null)
    .sort((a, b) => statementReferenceDate(b).localeCompare(statementReferenceDate(a)))[0];
}

function totalBalanceAtPeriodEnd(
  accounts: Account[],
  transactions: Transaction[],
  statementBalances: AccountStatementBalance[],
  period: string,
): number | null {
  const projectedBalances = accounts.map(account => ({
    account,
    balance: accountBalanceAtPeriodEnd(account.id, transactions, statementBalances, period),
  }));

  if (!projectedBalances.some(item => item.balance !== null)) {
    return null;
  }

  return projectedBalances.reduce(
    (sum, item) => sum + (item.balance ?? item.account.balance ?? 0),
    0,
  );
}

function accountBalanceAtPeriodEnd(
  accountId: string,
  transactions: Transaction[],
  statementBalances: AccountStatementBalance[],
  period: string,
): number | null {
  const targetEnd = periodEndDate(period);
  const balances = statementBalances
    .filter(balance => balance.accountId === accountId && balance.finalBalance !== null)
    .sort((a, b) => statementReferenceDate(a).localeCompare(statementReferenceDate(b)));

  const previous = [...balances]
    .reverse()
    .find(balance => statementReferenceDate(balance) <= targetEnd);

  if (previous?.finalBalance !== null && previous?.finalBalance !== undefined) {
    return previous.finalBalance + accountNetBetween(
      transactions,
      accountId,
      statementReferenceDate(previous),
      targetEnd,
    );
  }

  const next = balances.find(balance => statementReferenceDate(balance) > targetEnd);

  if (next?.finalBalance !== null && next?.finalBalance !== undefined) {
    return next.finalBalance - accountNetBetween(
      transactions,
      accountId,
      targetEnd,
      statementReferenceDate(next),
    );
  }

  return null;
}

function accountNetBetween(
  transactions: Transaction[],
  accountId: string,
  startExclusive: string,
  endInclusive: string,
): number {
  return transactions
    .filter(transaction => {
      const date = transaction.date.slice(0, 10);
      return !transaction.ignored
        && date > startExclusive
        && date <= endInclusive
        && (transaction.accountId === accountId || transaction.transferAccountId === accountId);
    })
    .reduce((sum, transaction) => sum + signedTransactionForAccount(transaction, accountId), 0);
}

function dayTrendPoints(transactions: Transaction[], days: number): TrendPoint[] {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - index));
    const key = dateKey(date);
    const dayTransactions = transactions.filter(transaction => !transaction.ignored && transaction.date.slice(0, 10) === key);
    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
      income: sumTransactionsByType(dayTransactions, 'credit'),
      expense: sumTransactionsByType(dayTransactions, 'debit'),
    };
  });
}

function monthTrendPoints(transactions: Transaction[], months: number): TrendPoint[] {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
  const today = new Date();
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (months - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthRows = transactions.filter(transaction => !transaction.ignored && transaction.date.slice(0, 7) === key);
    return {
      key,
      label: formatter.format(date).replace('.', ''),
      income: sumTransactionsByType(monthRows, 'credit'),
      expense: sumTransactionsByType(monthRows, 'debit'),
    };
  });
}

function yearTrendPoints(transactions: Transaction[], years: number): TrendPoint[] {
  const today = new Date();
  return Array.from({ length: years }, (_, index) => {
    const year = today.getFullYear() - (years - 1 - index);
    const yearRows = transactions.filter(transaction => !transaction.ignored && transaction.date.slice(0, 4) === String(year));
    return {
      key: String(year),
      label: String(year),
      income: sumTransactionsByType(yearRows, 'credit'),
      expense: sumTransactionsByType(yearRows, 'debit'),
    };
  });
}
