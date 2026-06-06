import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { FinancialCoachService, FinancialCoachSummary } from '../../services/financial-coach.service';
import { InvestmentPortfoliosService } from '../../services/investment-portfolios.service';
import { SavingGoalsService } from '../../services/saving-goals.service';
import { TransactionsService } from '../../services/transactions.service';
import { buildCategoryDoughnutChartConfig, buildTrendChartConfig } from './dashboard-chart.utils';
import {
  AccountSummaryRow,
  BudgetInsight,
  DailyExpensePoint,
  DashboardTrendRange,
  MonthFlow,
  PendingTab,
  TrendPoint,
  UpcomingEntry,
  accountRows,
  budgetInsights,
  categorySpending,
  currentMonthEnd,
  dailyExpensePoints,
  monthExpense,
  monthFlow,
  monthIncome,
  monthTransactions,
  openPayableAmount,
  openReceivableAmount,
  overduePayablesAmount,
  projectedBalanceInDays,
  todayKey,
  totalAccountBalance,
  trendPoints,
  upcomingEntries,
} from './dashboard.utils';

@Component({
  selector: 'app-dashboard.component',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trendChartCanvas') trendChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('expenseCategoryChartCanvas') expenseCategoryChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeCategoryChartCanvas') incomeCategoryChartCanvas?: ElementRef<HTMLCanvasElement>;

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
  trendRange = signal<DashboardTrendRange>('7d');
  pendingTab = signal<PendingTab>('payable');

  private chartsReady = false;
  private chartConstructor?: typeof import('chart.js/auto').default;
  private trendChart?: import('chart.js').Chart;
  private expenseCategoryChart?: import('chart.js').Chart;
  private incomeCategoryChart?: import('chart.js').Chart;

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
    private financialCoachService: FinancialCoachService,
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

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.queueChartRender();
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.expenseCategoryChart?.destroy();
    this.incomeCategoryChart?.destroy();
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
        .then(groups => {
          this.portfolioAssets.set(groups.flat());
          this.queueChartRender();
        });

      this.queueChartRender();
    });
  }

  totalBalance(): number {
    return totalAccountBalance(this.accounts(), this.statementBalances());
  }

  initialBalance(): number {
    return this.accounts().reduce((sum, account) => sum + (account.balance ?? 0), 0);
  }

  projectedBalance(): number {
    return this.totalBalance() + this.receivableOpenAmount() - this.payableOpenAmount();
  }

  currentMonthLabel(): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  }

  accountRows(): AccountSummaryRow[] {
    return accountRows(this.accounts(), this.statementBalances());
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
    return monthTransactions(this.transactions());
  }

  monthIncome(): number {
    return monthIncome(this.transactions());
  }

  monthExpense(): number {
    return monthExpense(this.transactions());
  }

  monthNet(): number {
    return this.monthIncome() - this.monthExpense();
  }

  budgetInsights(): BudgetInsight[] {
    return budgetInsights(this.budgets(), this.categories(), this.transactions());
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
    return upcomingEntries(this.payables(), this.receivables());
  }

  pendingExpenseCount(): number {
    return this.payables().filter(item => item.status === 'pending' || item.status === 'overdue').length;
  }

  pendingIncomeCount(): number {
    return this.receivables().filter(item => item.status === 'pending' || item.status === 'overdue').length;
  }

  overduePayablesAmount(): number {
    return overduePayablesAmount(this.payables());
  }

  receivableOpenAmount(): number {
    return openReceivableAmount(this.receivables());
  }

  payableOpenAmount(): number {
    return openPayableAmount(this.payables());
  }

  recentTransactions(): Transaction[] {
    return [...this.transactions()]
      .filter(transaction => !transaction.ignored)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  recentActivity(): Transaction[] {
    return this.recentTransactions().slice(0, 6);
  }

  monthFlow(): MonthFlow[] {
    return monthFlow(this.accounts(), this.transactions(), this.statementBalances());
  }

  maxFlowValue(): number {
    return Math.max(
      1,
      ...this.monthFlow().map(month => Math.max(month.income, month.expense)),
    );
  }

  categorySpending(): Array<{ category?: Category; amount: number; percent: number }> {
    return categorySpending(this.categories(), this.transactions(), 'expense');
  }

  topCategorySpending(): Array<{ category?: Category; amount: number; percent: number }> {
    return this.categorySpending().slice(0, 5);
  }

  dailyExpensePoints(): DailyExpensePoint[] {
    return dailyExpensePoints(this.transactions());
  }

  expenseSparklinePoints(): string {
    const points = this.dailyExpensePoints();
    const max = Math.max(1, ...points.map(point => point.amount));
    const lastIndex = Math.max(1, points.length - 1);

    return points.map((point, index) => {
      const x = (index / lastIndex) * 100;
      const y = 100 - ((point.amount / max) * 88);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  expenseSparklineArea(): string {
    return `0,100 ${this.expenseSparklinePoints()} 100,100`;
  }

  dailyExpenseHeight(amount: number): number {
    const max = Math.max(1, ...this.dailyExpensePoints().map(point => point.amount));
    return Math.max(6, (amount / max) * 100);
  }

  setTrendRange(range: DashboardTrendRange): void {
    this.trendRange.set(range);
    this.queueChartRender();
  }

  trendRangeLabel(): string {
    const labels: Record<DashboardTrendRange, string> = {
      '7d': 'Ultimos 7 dias',
      '30d': 'Ultimos 30 dias',
      '6m': 'Ultimos 6 meses',
      '12m': 'Ultimos 12 meses',
      '3y': 'Ultimos 3 anos',
    };

    return labels[this.trendRange()];
  }

  setPendingTab(tab: PendingTab): void {
    this.pendingTab.set(tab);
  }

  pendingTabLabel(): string {
    return this.pendingTab() === 'payable' ? 'contas a pagar' : 'contas a receber';
  }

  pendingTabCount(): number {
    return this.pendingTab() === 'payable' ? this.pendingExpenseCount() : this.pendingIncomeCount();
  }

  pendingTabAmount(): number {
    return this.pendingTab() === 'payable' ? this.payableOpenAmount() : this.receivableOpenAmount();
  }

  pendingTabEntries(): UpcomingEntry[] {
    return this.upcomingEntries()
      .filter(entry => this.pendingTab() === 'payable' ? entry.kind === 'payable' : entry.kind === 'receivable')
      .slice(0, 3);
  }

  projectedBalanceIn(daysAhead: number): number {
    return projectedBalanceInDays(this.totalBalance(), this.payables(), this.receivables(), daysAhead);
  }

  safeDailyLimit(): number {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
    const fixedPayables = this.payables()
      .filter(item => item.status === 'pending' && item.dueDate >= todayKey() && item.dueDate <= currentMonthEnd())
      .reduce((sum, item) => sum + item.amount, 0);
    const safetyMargin = Math.max(0, this.totalBalance() * 0.1);

    return Math.max(0, (this.totalBalance() - fixedPayables - safetyMargin) / remainingDays);
  }

  survivalPot(): number {
    const fixedCategoryIds = new Set(this.categories().filter(category => category.isFixed).map(category => category.id));
    return this.monthTransactions()
      .filter(transaction => transaction.type === 'debit' && transaction.categoryId && fixedCategoryIds.has(transaction.categoryId))
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  pleasurePot(): number {
    return Math.max(0, this.monthExpense() - this.survivalPot() - this.coachSummary().monthWealthBuilding);
  }

  futurePot(): number {
    return this.coachSummary().monthWealthBuilding + Math.max(0, this.monthNet());
  }

  incomeCategorySpending(): Array<{ category?: Category; amount: number; percent: number }> {
    return categorySpending(this.categories(), this.transactions(), 'income');
  }

  topIncomeCategories(): Array<{ category?: Category; amount: number; percent: number }> {
    return this.incomeCategorySpending().slice(0, 5);
  }

  trendPoints(): TrendPoint[] {
    return trendPoints(this.transactions(), this.trendRange());
  }

  featuredBudgetInsights(): BudgetInsight[] {
    return this.budgetInsights().slice(0, 4);
  }

  activeGoals(): SavingGoal[] {
    return this.savingGoals().filter(goal => goal.status !== 'completed').slice(0, 4);
  }

  investmentReturn(): number {
    return this.investmentsValue() - this.investedCost();
  }

  investmentReturnPercent(): number {
    const cost = this.investedCost();
    return cost > 0 ? (this.investmentReturn() / cost) * 100 : 0;
  }

  coachSummary(): FinancialCoachSummary {
    return this.financialCoachService.buildSummary({
      accounts: this.accounts(),
      transactions: this.transactions(),
      categories: this.categories(),
      budgets: this.budgets(),
      savingGoals: this.savingGoals(),
      payables: this.payables(),
      receivables: this.receivables(),
      investmentAssets: this.portfolioAssets(),
    });
  }

  financialHealthScore(): number {
    return this.coachSummary().healthScore;
  }

  healthLabel(): string {
    return this.coachSummary().healthLabel;
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

  accountTypeLabel(type: Account['type']): string {
    const labels: Record<Account['type'], string> = {
      checking: 'Conta corrente',
      savings: 'Poupanca',
      cash: 'Dinheiro',
      investment: 'Investimento',
    };

    return labels[type];
  }

  transactionIcon(transaction: Transaction): string {
    if (transaction.type === 'transfer') return 'sync_alt';
    return this.getTransactionCategory(transaction)?.icon || (transaction.type === 'credit' ? 'add_circle' : 'remove_circle');
  }

  transactionColor(transaction: Transaction): string {
    if (transaction.type === 'transfer') return '#f5b70a';
    return this.getTransactionCategory(transaction)?.color || (transaction.type === 'credit' ? '#169b62' : '#dc3d35');
  }

  formatPercent(value: number): string {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  }

  private queueChartRender(): void {
    if (!this.chartsReady) return;
    queueMicrotask(() => void this.renderCharts());
  }

  private async renderCharts(): Promise<void> {
    await this.renderTrendChart();
    await this.renderExpenseCategoryChart();
    await this.renderIncomeCategoryChart();
  }

  private async getChartConstructor(): Promise<typeof import('chart.js/auto').default> {
    if (!this.chartConstructor) {
      this.chartConstructor = (await import('chart.js/auto')).default;
    }

    return this.chartConstructor;
  }

  private async renderTrendChart(): Promise<void> {
    const canvas = this.trendChartCanvas?.nativeElement;
    if (!canvas) return;

    const ChartConstructor = await this.getChartConstructor();

    this.trendChart?.destroy();
    this.trendChart = new ChartConstructor(canvas, buildTrendChartConfig(this.trendPoints()));
  }

  private async renderExpenseCategoryChart(): Promise<void> {
    const canvas = this.expenseCategoryChartCanvas?.nativeElement;
    if (!canvas) return;

    const ChartConstructor = await this.getChartConstructor();
    const rows = this.categorySpending().filter(row => row.amount > 0);
    this.expenseCategoryChart?.destroy();
    this.expenseCategoryChart = new ChartConstructor(canvas, buildCategoryDoughnutChartConfig(rows));
  }

  private async renderIncomeCategoryChart(): Promise<void> {
    const canvas = this.incomeCategoryChartCanvas?.nativeElement;
    if (!canvas) return;

    const ChartConstructor = await this.getChartConstructor();
    const rows = this.incomeCategorySpending().filter(row => row.amount > 0);
    this.incomeCategoryChart?.destroy();
    this.incomeCategoryChart = new ChartConstructor(canvas, buildCategoryDoughnutChartConfig(rows));
  }

  today(): string {
    return todayKey();
  }
}
