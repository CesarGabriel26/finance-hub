// ── Accounts ─────────────────────────────────────────────────────────────────
import {
  registerGetAccounts,
  registerGetAccountById,
  registerInsertAccount,
  registerUpdateAccount,
  registerDeleteAccount,
} from './accounts';
import {
  registerGetAccountsReceivable,
  registerGetAccountReceivableById,
  registerInsertAccountReceivable,
  registerUpdateAccountReceivable,
  registerDeleteAccountReceivable,
} from './accounts-receivable';
import {
  registerGetAccountsPayable,
  registerGetAccountPayableById,
  registerInsertAccountPayable,
  registerUpdateAccountPayable,
  registerDeleteAccountPayable,
} from './accounts-payable';
import {
  registerGetAccountStatementBalances,
  registerUpsertAccountStatementBalance,
} from './account-statement-balances';

// ── Categories ────────────────────────────────────────────────────────────────
import {
  registerGetCategories,
  registerGetCategoryById,
  registerInsertCategory,
  registerUpdateCategory,
  registerDeleteCategory,
} from './categories';

// ── Transactions ──────────────────────────────────────────────────────────────
import {
  registerGetTransactions,
  registerGetTransactionById,
  registerInsertTransactions,
  registerUpdateTransaction,
  registerDeleteTransaction,
} from './transactions';

// ── Budgets ───────────────────────────────────────────────────────────────────
import {
  registerGetBudgets,
  registerGetBudgetById,
  registerInsertBudget,
  registerUpdateBudget,
  registerDeleteBudget,
} from './budgets';

// ── Assets ────────────────────────────────────────────────────────────────────
import {
  registerGetAssets,
  registerGetAssetById,
  registerInsertAsset,
  registerUpdateAsset,
  registerDeleteAsset,
} from './assets';
import {
  registerGetInvestmentPortfolios,
  registerGetInvestmentPortfolioById,
  registerInsertInvestmentPortfolio,
  registerUpdateInvestmentPortfolio,
  registerDeleteInvestmentPortfolio,
  registerGetInvestmentPortfolioAssets,
  registerInsertInvestmentPortfolioAsset,
  registerUpdateInvestmentPortfolioAsset,
  registerDeleteInvestmentPortfolioAsset,
} from './investment-portfolios';
import { registerMarketRatesHandlers } from './market-rates';

// ── Asset Transactions ────────────────────────────────────────────────────────
import {
  registerGetAssetTransactions,
  registerGetAssetTransactionById,
  registerInsertAssetTransaction,
  registerUpdateAssetTransaction,
  registerDeleteAssetTransaction,
} from './asset-transactions';

// ── Saving Goals ──────────────────────────────────────────────────────────────
import {
  registerGetSavingGoals,
  registerGetSavingGoalById,
  registerInsertSavingGoal,
  registerUpdateSavingGoal,
  registerDeleteSavingGoal,
} from './saving-goals';
import { registerNotificationHandlers } from './notifications';

/**
 * Registra todos os handlers IPC da API financeira.
 * Deve ser chamado uma única vez dentro do `app.whenReady()` no main process.
 */
export function initFinancialApi() {
  // Accounts
  registerGetAccounts();
  registerGetAccountById();
  registerInsertAccount();
  registerUpdateAccount();
  registerDeleteAccount();

  // Accounts receivable
  registerGetAccountsReceivable();
  registerGetAccountReceivableById();
  registerInsertAccountReceivable();
  registerUpdateAccountReceivable();
  registerDeleteAccountReceivable();

  // Accounts payable
  registerGetAccountsPayable();
  registerGetAccountPayableById();
  registerInsertAccountPayable();
  registerUpdateAccountPayable();
  registerDeleteAccountPayable();

  // Account statement balances
  registerGetAccountStatementBalances();
  registerUpsertAccountStatementBalance();

  // Categories
  registerGetCategories();
  registerGetCategoryById();
  registerInsertCategory();
  registerUpdateCategory();
  registerDeleteCategory();

  // Transactions
  registerGetTransactions();
  registerGetTransactionById();
  registerInsertTransactions();
  registerUpdateTransaction();
  registerDeleteTransaction();

  // Budgets
  registerGetBudgets();
  registerGetBudgetById();
  registerInsertBudget();
  registerUpdateBudget();
  registerDeleteBudget();

  // Assets
  registerGetAssets();
  registerGetAssetById();
  registerInsertAsset();
  registerUpdateAsset();
  registerDeleteAsset();

  // Investment Portfolios
  registerGetInvestmentPortfolios();
  registerGetInvestmentPortfolioById();
  registerInsertInvestmentPortfolio();
  registerUpdateInvestmentPortfolio();
  registerDeleteInvestmentPortfolio();
  registerGetInvestmentPortfolioAssets();
  registerInsertInvestmentPortfolioAsset();
  registerUpdateInvestmentPortfolioAsset();
  registerDeleteInvestmentPortfolioAsset();
  registerMarketRatesHandlers();

  // Asset Transactions
  registerGetAssetTransactions();
  registerGetAssetTransactionById();
  registerInsertAssetTransaction();
  registerUpdateAssetTransaction();
  registerDeleteAssetTransaction();

  // Saving Goals
  registerGetSavingGoals();
  registerGetSavingGoalById();
  registerInsertSavingGoal();
  registerUpdateSavingGoal();
  registerDeleteSavingGoal();

  // Notifications
  registerNotificationHandlers();
}
