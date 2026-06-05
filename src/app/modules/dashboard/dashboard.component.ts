import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  Account,
  AccountStatementBalance,
  AccountPayable,
  AccountReceivable,
  Budget,
  Category,
  InvestmentPortfolio,
  InvestmentPortfolioAsset,
  SavingGoal,
  Transaction,
} from '../../models';
import { AccountsPayableService } from '../../services/accounts-payable.service';
import { AccountsReceivableService } from '../../services/accounts-receivable.service';
import { AccountsService } from '../../services/accounts.service';
import { AccountStatementBalancesService } from '../../services/account-statement-balances.service';
import { BudgetsService } from '../../services/budgets.service';
import { CategoriesService } from '../../services/categories.service';
import { InvestmentPortfoliosService } from '../../services/investment-portfolios.service';
import { SavingGoalsService } from '../../services/saving-goals.service';
import { TransactionsService } from '../../services/transactions.service';

interface MonthFlow {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number | null;
}

interface BudgetInsight {
  budget: Budget;
  category?: Category;
  spent: number;
  progress: number;
}

interface UpcomingEntry {
  id: string;
  kind: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: string;
  status: string;
}

@Component({
  selector: 'app-dashboard.component',
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  accounts = signal<Account[]>([]);
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  budgets = signal<Budget[]>([]);
  savingGoals = signal<SavingGoal[]>([]);
  payables = signal<AccountPayable[]>([]);
  receivables = signal<AccountReceivable[]>([]);
  statementBalances = signal<AccountStatementBalance[]>([]);
  portfolios = signal<InvestmentPortfolio[]>([]);
  portfolioAssets = signal<InvestmentPortfolioAsset[]>([]);

  constructor(
    private accountsService: AccountsService,
    private statementBalancesService: AccountStatementBalancesService,
    private transactionsService: TransactionsService,
    private categoriesService: CategoriesService,
    private budgetsService: BudgetsService,
    private goalsService: SavingGoalsService,
    private payablesService: AccountsPayableService,
    private receivablesService: AccountsReceivableService,
    private portfoliosService: InvestmentPortfoliosService,
  ) {}

  ngOnInit(): void {
    this.load();

    this.accountsService.updated.subscribe(() => this.load());
    this.statementBalancesService.updated.subscribe(() => this.load());
    this.transactionsService.updated.subscribe(() => this.load());
    this.budgetsService.updated.subscribe(() => this.load());
    this.goalsService.updated.subscribe(() => this.load());
    this.payablesService.updated.subscribe(() => this.load());
    this.receivablesService.updated.subscribe(() => this.load());
    this.portfoliosService.updated.subscribe(() => this.load());
  }

  load(): void {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    Promise.all([
      this.accountsService.getAll(),
      this.statementBalancesService.getAll(),
      this.transactionsService.getAll(),
      this.categoriesService.getAll(),
      this.budgetsService.getAll(month, year),
      this.goalsService.getAll(),
      this.payablesService.getAll(),
      this.receivablesService.getAll(),
      this.portfoliosService.getAll(),
    ]).then(([accounts, statementBalances, transactions, categories, budgets, goals, payables, receivables, portfolios]) => {
      this.accounts.set(accounts);
      this.statementBalances.set(statementBalances);
      this.transactions.set(transactions);
      this.categories.set(categories);
      this.budgets.set(budgets);
      this.savingGoals.set(goals);
      this.payables.set(payables);
      this.receivables.set(receivables);
      this.portfolios.set(portfolios);

      Promise.all(portfolios.map(portfolio => this.portfoliosService.getAssets(portfolio.id)))
        .then(groups => this.portfolioAssets.set(groups.flat()));
    });
  }

  totalBalance(): number {
    return this.accounts().reduce((sum, account) => sum + this.accountCurrentBalance(account), 0);
  }

  investmentsValue(): number {
    return this.portfolioAssets().reduce(
      (sum, asset) => sum + asset.quantity * asset.currentPrice,
      0,
    );
  }

  investedCost(): number {
    return this.portfolioAssets().reduce(
      (sum, asset) => sum + asset.quantity * asset.averagePrice,
      0,
    );
  }

  netWorth(): number {
    return this.totalBalance() + this.investmentsValue();
  }

  monthTransactions(): Transaction[] {
    const start = this.currentMonthStart();
    const end = this.currentMonthEnd();
    return this.transactions().filter(transaction => {
      const date = transaction.date.slice(0, 10);
      return date >= start && date <= end && !transaction.ignored;
    });
  }

  monthIncome(): number {
    return this.monthTransactions()
      .filter(transaction => transaction.type === 'credit')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  monthExpense(): number {
    return this.monthTransactions()
      .filter(transaction => transaction.type === 'debit')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  monthNet(): number {
    return this.monthIncome() - this.monthExpense();
  }

  budgetInsights(): BudgetInsight[] {
    return this.budgets().map(budget => {
      const spent = this.monthTransactions()
        .filter(transaction => transaction.type === 'debit' && transaction.categoryId === budget.categoryId)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

      return {
        budget,
        category: this.categories().find(category => category.id === budget.categoryId),
        spent,
        progress: budget.amountLimit > 0 ? Math.min(100, (spent / budget.amountLimit) * 100) : 0,
      };
    }).sort((a, b) => b.progress - a.progress);
  }

  totalBudgetLimit(): number {
    return this.budgets().reduce((sum, budget) => sum + budget.amountLimit, 0);
  }

  totalBudgetSpent(): number {
    return this.budgetInsights().reduce((sum, insight) => sum + insight.spent, 0);
  }

  budgetUsage(): number {
    const limit = this.totalBudgetLimit();
    return limit > 0 ? (this.totalBudgetSpent() / limit) * 100 : 0;
  }

  goalProgress(goal: SavingGoal): number {
    return goal.targetAmount > 0
      ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  }

  averageGoalProgress(): number {
    const activeGoals = this.savingGoals().filter(goal => goal.status !== 'completed');
    if (activeGoals.length === 0) return 0;
    return activeGoals.reduce((sum, goal) => sum + this.goalProgress(goal), 0) / activeGoals.length;
  }

  upcomingEntries(): UpcomingEntry[] {
    const payables = this.payables()
      .filter(item => item.status === 'pending' || item.status === 'overdue')
      .map(item => ({
        id: item.id,
        kind: 'payable' as const,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        status: item.status,
      }));

    const receivables = this.receivables()
      .filter(item => item.status === 'pending' || item.status === 'overdue')
      .map(item => ({
        id: item.id,
        kind: 'receivable' as const,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        status: item.status,
      }));

    return [...payables, ...receivables]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  overduePayablesAmount(): number {
    const today = this.today();
    return this.payables()
      .filter(item => (item.status === 'pending' || item.status === 'overdue') && item.dueDate < today)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  receivableOpenAmount(): number {
    return this.receivables()
      .filter(item => item.status === 'pending' || item.status === 'overdue')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  payableOpenAmount(): number {
    return this.payables()
      .filter(item => item.status === 'pending' || item.status === 'overdue')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  recentTransactions(): Transaction[] {
    return [...this.transactions()]
      .filter(transaction => !transaction.ignored)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  monthFlow(): MonthFlow[] {
    const months = this.lastMonths(6);
    return months.map(({ key, label }) => {
      const monthTransactions = this.transactions().filter(transaction => transaction.date.slice(0, 7) === key);
      const income = monthTransactions
        .filter(transaction => transaction.type === 'credit')
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      const expense = monthTransactions
        .filter(transaction => transaction.type === 'debit')
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

      return {
        key,
        label,
        income,
        expense,
        net: income - expense,
        balance: this.totalBalanceAtPeriodEnd(key),
      };
    });
  }

  maxFlowValue(): number {
    return Math.max(
      1,
      ...this.monthFlow().map(month => Math.max(month.income, month.expense)),
    );
  }

  categorySpending(): Array<{ category?: Category; amount: number; percent: number }> {
    const total = this.monthExpense();
    const rows = this.categories()
      .filter(category => category.type === 'expense')
      .map(category => {
        const amount = this.monthTransactions()
          .filter(transaction => transaction.type === 'debit' && transaction.categoryId === category.id)
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

  investmentReturn(): number {
    return this.investmentsValue() - this.investedCost();
  }

  investmentReturnPercent(): number {
    const cost = this.investedCost();
    return cost > 0 ? (this.investmentReturn() / cost) * 100 : 0;
  }

  financialHealthScore(): number {
    let score = 100;

    if (this.monthNet() < 0) score -= 12;
    if (this.budgetUsage() > 100) score -= 18;
    else if (this.budgetUsage() > 85) score -= 8;
    if (this.overduePayablesAmount() > 0) score -= 16;
    if (this.receivableOpenAmount() > this.payableOpenAmount()) score += 4;
    if (this.investmentsValue() > 0) score += 4;
    if (this.averageGoalProgress() > 50) score += 4;

    return Math.max(0, Math.min(100, score));
  }

  healthLabel(): string {
    const score = this.financialHealthScore();
    if (score >= 85) return 'Forte';
    if (score >= 70) return 'Estavel';
    if (score >= 50) return 'Atencao';
    return 'Critica';
  }

  signedTransactionAmount(transaction: Transaction): number {
    if (transaction.type === 'debit') return -Math.abs(transaction.amount);
    return Math.abs(transaction.amount);
  }

  getTransactionCategory(transaction: Transaction): Category | undefined {
    return this.categories().find(category => category.id === transaction.categoryId);
  }

  getAccountName(transaction: Transaction): string {
    return this.accounts().find(account => account.id === transaction.accountId)?.name ?? 'Sem conta';
  }

  barHeight(value: number): number {
    return Math.max(4, (value / this.maxFlowValue()) * 100);
  }

  progressClass(value: number): string {
    if (value >= 100) return 'bg-red-600';
    if (value >= 85) return 'bg-amber-500';
    return 'bg-emerald-600';
  }

  resultClass(value: number): string {
    if (value > 0) return 'text-emerald-700';
    if (value < 0) return 'text-red-700';
    return 'text-muted-foreground';
  }

  formatPercent(value: number): string {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  }

  private currentMonthStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private currentMonthEnd(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  }

  private accountCurrentBalance(account: Account): number {
    return this.latestStatementBalance(account.id)?.finalBalance ?? account.balance ?? 0;
  }

  private latestStatementBalance(accountId: string): AccountStatementBalance | undefined {
    return this.statementBalances()
      .filter(balance => balance.accountId === accountId && balance.finalBalance !== null)
      .sort((a, b) => this.statementReferenceDate(b).localeCompare(this.statementReferenceDate(a)))[0];
  }

  private totalBalanceAtPeriodEnd(period: string): number | null {
    const projectedBalances = this.accounts().map(account => ({
      account,
      balance: this.accountBalanceAtPeriodEnd(account.id, period),
    }));

    if (!projectedBalances.some(item => item.balance !== null)) {
      return null;
    }

    return projectedBalances.reduce(
      (sum, item) => sum + (item.balance ?? item.account.balance ?? 0),
      0,
    );
  }

  private accountBalanceAtPeriodEnd(accountId: string, period: string): number | null {
    const targetEnd = this.periodEndDate(period);
    const balances = this.statementBalances()
      .filter(balance => balance.accountId === accountId && balance.finalBalance !== null)
      .sort((a, b) => this.statementReferenceDate(a).localeCompare(this.statementReferenceDate(b)));

    const previous = [...balances]
      .reverse()
      .find(balance => this.statementReferenceDate(balance) <= targetEnd);

    if (previous?.finalBalance !== null && previous?.finalBalance !== undefined) {
      return previous.finalBalance + this.accountNetBetween(
        accountId,
        this.statementReferenceDate(previous),
        targetEnd,
      );
    }

    const next = balances.find(balance => this.statementReferenceDate(balance) > targetEnd);

    if (next?.finalBalance !== null && next?.finalBalance !== undefined) {
      return next.finalBalance - this.accountNetBetween(
        accountId,
        targetEnd,
        this.statementReferenceDate(next),
      );
    }

    return null;
  }

  private accountNetBetween(accountId: string, startExclusive: string, endInclusive: string): number {
    return this.transactions()
      .filter(transaction => {
        const date = transaction.date.slice(0, 10);
        return !transaction.ignored
          && date > startExclusive
          && date <= endInclusive
          && (transaction.accountId === accountId || transaction.transferAccountId === accountId);
      })
      .reduce((sum, transaction) => sum + this.signedTransactionForAccount(transaction, accountId), 0);
  }

  private signedTransactionForAccount(transaction: Transaction, accountId: string): number {
    const amount = Math.abs(transaction.amount);

    if (transaction.type === 'transfer') {
      if (transaction.transferAccountId === accountId) return amount;
      if (transaction.accountId === accountId) return -amount;
      return 0;
    }

    if (transaction.accountId !== accountId) return 0;
    return transaction.type === 'debit' ? -amount : amount;
  }

  private statementReferenceDate(balance: AccountStatementBalance): string {
    return balance.statementEndDate ?? this.periodEndDate(balance.period);
  }

  private periodEndDate(period: string): string {
    const [year, month] = period.split('-').map(Number);
    return new Date(year, month, 0).toISOString().slice(0, 10);
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private lastMonths(count: number): Array<{ key: string; label: string }> {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    const months: Array<{ key: string; label: string }> = [];
    const now = new Date();

    for (let index = count - 1; index >= 0; index--) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: formatter.format(date).replace('.', ''),
      });
    }

    return months;
  }
}
