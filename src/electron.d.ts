import type {
  Account,
  NewAccount,
} from './app/models/account.model';

import type {
  AccountReceivable,
  NewAccountReceivable,
} from './app/models/account-receivable.model';

import type {
  AccountPayable,
  NewAccountPayable,
} from './app/models/account-payable.model';

import type {
  AccountStatementBalance,
  NewAccountStatementBalance,
} from './app/models/account-statement-balance.model';

import type {
  Category,
  CategoryRule,
  NewCategory,
  NewCategoryRule,
} from './app/models/category.model';

import type {
  Transaction,
  NewTransaction,
} from './app/models/transaction.model';

import type {
  Budget,
  NewBudget,
} from './app/models/budget.model';

import type {
  Asset,
  NewAsset,
} from './app/models/asset.model';

import type {
  AssetTransaction,
  NewAssetTransaction,
} from './app/models/asset-transaction.model';

import type {
  SavingGoal,
  NewSavingGoal,
} from './app/models/saving-goal.model';

import type {
  InvestmentPortfolio,
  InvestmentAssetSnapshot,
  InvestmentPortfolioAsset,
  NewInvestmentPortfolio,
  NewInvestmentAssetSnapshot,
  NewInvestmentPortfolioAsset,
} from './app/models/investment-portfolio.model';

import type {
  MarketRatesCache,
} from './app/models/market-rate.model';

import type {
  MonthlyClosing,
  NewMonthlyClosing,
} from './app/models/monthly-closing.model';

import type {
  AccountReconciliation,
  NewAccountReconciliation,
} from './app/models/account-reconciliation.model';

// ─────────────────────────────────────────────────────────────────────────────
// App / Electron utilities
// ─────────────────────────────────────────────────────────────────────────────
interface AppApi {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  isElectron: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────
interface AccountsApi {
  getAll: (filters?: { type?: string, name?: string }) => Promise<Account[]>;
  getById: (id: string) => Promise<Account | null>;
  insert: (data: NewAccount) => Promise<Account>;
  update: (id: string, data: Partial<NewAccount>) => Promise<Account | null>;
  delete: (id: string) => Promise<Account | null>;
}

interface AccountsReceivableApi {
  getAll: (filters?: Record<string, unknown>) => Promise<AccountReceivable[]>;
  getById: (id: string) => Promise<AccountReceivable | null>;
  insert: (data: NewAccountReceivable) => Promise<AccountReceivable>;
  update: (id: string, data: Partial<NewAccountReceivable>) => Promise<AccountReceivable | null>;
  delete: (id: string) => Promise<AccountReceivable | null>;
}

interface AccountsPayableApi {
  getAll: (filters?: Record<string, unknown>) => Promise<AccountPayable[]>;
  getById: (id: string) => Promise<AccountPayable | null>;
  insert: (data: NewAccountPayable) => Promise<AccountPayable>;
  update: (id: string, data: Partial<NewAccountPayable>) => Promise<AccountPayable | null>;
  delete: (id: string) => Promise<AccountPayable | null>;
}

interface AccountStatementBalancesApi {
  getAll: (filters?: Record<string, unknown>) => Promise<AccountStatementBalance[]>;
  upsert: (data: NewAccountStatementBalance) => Promise<AccountStatementBalance>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────
interface CategoriesApi {
  getAll: (filters?: { type?: string, name?: string }) => Promise<Category[]>;
  getById: (id: string) => Promise<Category | null>;
  insert: (data: NewCategory) => Promise<Category>;
  update: (id: string, data: Partial<NewCategory>) => Promise<Category | null>;
  delete: (id: string) => Promise<Category | null>;
}

interface CategoryRulesApi {
  getAll: () => Promise<CategoryRule[]>;
  insert: (data: NewCategoryRule) => Promise<CategoryRule>;
  update: (id: string, data: Partial<NewCategoryRule>) => Promise<CategoryRule | null>;
  delete: (id: string) => Promise<CategoryRule | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────
interface TransactionsApi {
  getAll: (query?: string | Record<string, unknown>) => Promise<Transaction[]>;
  getById: (id: string) => Promise<Transaction | null>;
  insert: (data: NewTransaction | NewTransaction[]) => Promise<Transaction[]>;
  update: (id: string, data: Partial<NewTransaction>) => Promise<Transaction | null>;
  delete: (id: string) => Promise<Transaction | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────────
interface BudgetsApi {
  getAll: (month: number, year: number) => Promise<Budget[]>;
  getById: (id: string) => Promise<Budget | null>;
  insert: (data: NewBudget) => Promise<Budget>;
  update: (id: string, data: Partial<NewBudget>) => Promise<Budget | null>;
  delete: (id: string) => Promise<Budget | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assets
// ─────────────────────────────────────────────────────────────────────────────
interface AssetsApi {
  getAll: () => Promise<Asset[]>;
  getById: (id: string) => Promise<Asset | null>;
  insert: (data: NewAsset) => Promise<Asset>;
  update: (id: string, data: Partial<NewAsset>) => Promise<Asset | null>;
  delete: (id: string) => Promise<Asset | null>;
}

interface InvestmentPortfoliosApi {
  getAll: () => Promise<InvestmentPortfolio[]>;
  getById: (id: string) => Promise<InvestmentPortfolio | null>;
  insert: (data: NewInvestmentPortfolio) => Promise<InvestmentPortfolio>;
  update: (id: string, data: Partial<NewInvestmentPortfolio>) => Promise<InvestmentPortfolio | null>;
  delete: (id: string) => Promise<InvestmentPortfolio | null>;
  getAssets: (portfolioId: string) => Promise<InvestmentPortfolioAsset[]>;
  insertAsset: (data: NewInvestmentPortfolioAsset) => Promise<InvestmentPortfolioAsset>;
  updateAsset: (
    id: string,
    data: Partial<NewInvestmentPortfolioAsset>,
  ) => Promise<InvestmentPortfolioAsset | null>;
  deleteAsset: (id: string) => Promise<InvestmentPortfolioAsset | null>;
  getAssetSnapshots: (portfolioId: string) => Promise<InvestmentAssetSnapshot[]>;
  insertAssetSnapshot: (data: NewInvestmentAssetSnapshot) => Promise<InvestmentAssetSnapshot>;
}

interface MarketRatesApi {
  getCache: () => Promise<MarketRatesCache>;
  refresh: () => Promise<MarketRatesCache>;
}

interface DueNotificationOptions {
  daysAhead?: number;
  force?: boolean;
}

interface DueNotificationResult {
  notified: boolean;
  payablesCount: number;
  receivablesCount: number;
  overdueCount: number;
  dueUntil: string;
}

interface NotificationsApi {
  checkDue: (options?: DueNotificationOptions) => Promise<DueNotificationResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Transactions
// ─────────────────────────────────────────────────────────────────────────────
interface AssetTransactionsApi {
  getAll: (assetId: string) => Promise<AssetTransaction[]>;
  getById: (id: string) => Promise<AssetTransaction | null>;
  insert: (data: NewAssetTransaction) => Promise<AssetTransaction>;
  update: (id: string, data: Partial<NewAssetTransaction>) => Promise<AssetTransaction | null>;
  delete: (id: string) => Promise<AssetTransaction | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Saving Goals
// ─────────────────────────────────────────────────────────────────────────────
interface SavingGoalsApi {
  getAll: () => Promise<SavingGoal[]>;
  getById: (id: string) => Promise<SavingGoal | null>;
  insert: (data: NewSavingGoal) => Promise<SavingGoal>;
  update: (id: string, data: Partial<NewSavingGoal>) => Promise<SavingGoal | null>;
  delete: (id: string) => Promise<SavingGoal | null>;
}

interface MonthlyClosingsApi {
  getAll: () => Promise<MonthlyClosing[]>;
  upsert: (data: NewMonthlyClosing) => Promise<MonthlyClosing>;
}

interface AccountReconciliationsApi {
  getAll: (period?: string) => Promise<AccountReconciliation[]>;
  upsert: (data: NewAccountReconciliation) => Promise<AccountReconciliation>;
}

interface MaintenanceResult {
  ok: boolean;
  path?: string;
  restartScheduled?: boolean;
  message: string;
}

interface MaintenanceApi {
  backup: () => Promise<MaintenanceResult>;
  restore: () => Promise<MaintenanceResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Window augmentation
// ─────────────────────────────────────────────────────────────────────────────
declare global {

  interface Window {
    AppApi?: AppApi;
    AccountsApi?: AccountsApi;
    AccountsReceivableApi?: AccountsReceivableApi;
    AccountsPayableApi?: AccountsPayableApi;
    AccountStatementBalancesApi?: AccountStatementBalancesApi;
    CategoriesApi?: CategoriesApi;
    CategoryRulesApi?: CategoryRulesApi;
    TransactionsApi?: TransactionsApi;
    BudgetsApi?: BudgetsApi;
    AssetsApi?: AssetsApi;
    InvestmentPortfoliosApi?: InvestmentPortfoliosApi;
    MarketRatesApi?: MarketRatesApi;
    NotificationsApi?: NotificationsApi;
    AssetTransactionsApi?: AssetTransactionsApi;
    SavingGoalsApi?: SavingGoalsApi;
    MonthlyClosingsApi?: MonthlyClosingsApi;
    AccountReconciliationsApi?: AccountReconciliationsApi;
    MaintenanceApi?: MaintenanceApi;
  }
}
