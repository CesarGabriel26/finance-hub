"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFinancialApi = initFinancialApi;
// ── Accounts ─────────────────────────────────────────────────────────────────
const accounts_1 = require("./accounts");
const accounts_receivable_1 = require("./accounts-receivable");
const accounts_payable_1 = require("./accounts-payable");
const account_statement_balances_1 = require("./account-statement-balances");
// ── Categories ────────────────────────────────────────────────────────────────
const categories_1 = require("./categories");
// ── Transactions ──────────────────────────────────────────────────────────────
const transactions_1 = require("./transactions");
// ── Budgets ───────────────────────────────────────────────────────────────────
const budgets_1 = require("./budgets");
// ── Assets ────────────────────────────────────────────────────────────────────
const assets_1 = require("./assets");
const investment_portfolios_1 = require("./investment-portfolios");
const market_rates_1 = require("./market-rates");
// ── Asset Transactions ────────────────────────────────────────────────────────
const asset_transactions_1 = require("./asset-transactions");
// ── Saving Goals ──────────────────────────────────────────────────────────────
const saving_goals_1 = require("./saving-goals");
const notifications_1 = require("./notifications");
/**
 * Registra todos os handlers IPC da API financeira.
 * Deve ser chamado uma única vez dentro do `app.whenReady()` no main process.
 */
function initFinancialApi() {
    // Accounts
    (0, accounts_1.registerGetAccounts)();
    (0, accounts_1.registerGetAccountById)();
    (0, accounts_1.registerInsertAccount)();
    (0, accounts_1.registerUpdateAccount)();
    (0, accounts_1.registerDeleteAccount)();
    // Accounts receivable
    (0, accounts_receivable_1.registerGetAccountsReceivable)();
    (0, accounts_receivable_1.registerGetAccountReceivableById)();
    (0, accounts_receivable_1.registerInsertAccountReceivable)();
    (0, accounts_receivable_1.registerUpdateAccountReceivable)();
    (0, accounts_receivable_1.registerDeleteAccountReceivable)();
    // Accounts payable
    (0, accounts_payable_1.registerGetAccountsPayable)();
    (0, accounts_payable_1.registerGetAccountPayableById)();
    (0, accounts_payable_1.registerInsertAccountPayable)();
    (0, accounts_payable_1.registerUpdateAccountPayable)();
    (0, accounts_payable_1.registerDeleteAccountPayable)();
    // Account statement balances
    (0, account_statement_balances_1.registerGetAccountStatementBalances)();
    (0, account_statement_balances_1.registerUpsertAccountStatementBalance)();
    // Categories
    (0, categories_1.registerGetCategories)();
    (0, categories_1.registerGetCategoryById)();
    (0, categories_1.registerInsertCategory)();
    (0, categories_1.registerUpdateCategory)();
    (0, categories_1.registerDeleteCategory)();
    // Transactions
    (0, transactions_1.registerGetTransactions)();
    (0, transactions_1.registerGetTransactionById)();
    (0, transactions_1.registerInsertTransactions)();
    (0, transactions_1.registerUpdateTransaction)();
    (0, transactions_1.registerDeleteTransaction)();
    // Budgets
    (0, budgets_1.registerGetBudgets)();
    (0, budgets_1.registerGetBudgetById)();
    (0, budgets_1.registerInsertBudget)();
    (0, budgets_1.registerUpdateBudget)();
    (0, budgets_1.registerDeleteBudget)();
    // Assets
    (0, assets_1.registerGetAssets)();
    (0, assets_1.registerGetAssetById)();
    (0, assets_1.registerInsertAsset)();
    (0, assets_1.registerUpdateAsset)();
    (0, assets_1.registerDeleteAsset)();
    // Investment Portfolios
    (0, investment_portfolios_1.registerGetInvestmentPortfolios)();
    (0, investment_portfolios_1.registerGetInvestmentPortfolioById)();
    (0, investment_portfolios_1.registerInsertInvestmentPortfolio)();
    (0, investment_portfolios_1.registerUpdateInvestmentPortfolio)();
    (0, investment_portfolios_1.registerDeleteInvestmentPortfolio)();
    (0, investment_portfolios_1.registerGetInvestmentPortfolioAssets)();
    (0, investment_portfolios_1.registerInsertInvestmentPortfolioAsset)();
    (0, investment_portfolios_1.registerUpdateInvestmentPortfolioAsset)();
    (0, investment_portfolios_1.registerDeleteInvestmentPortfolioAsset)();
    (0, market_rates_1.registerMarketRatesHandlers)();
    // Asset Transactions
    (0, asset_transactions_1.registerGetAssetTransactions)();
    (0, asset_transactions_1.registerGetAssetTransactionById)();
    (0, asset_transactions_1.registerInsertAssetTransaction)();
    (0, asset_transactions_1.registerUpdateAssetTransaction)();
    (0, asset_transactions_1.registerDeleteAssetTransaction)();
    // Saving Goals
    (0, saving_goals_1.registerGetSavingGoals)();
    (0, saving_goals_1.registerGetSavingGoalById)();
    (0, saving_goals_1.registerInsertSavingGoal)();
    (0, saving_goals_1.registerUpdateSavingGoal)();
    (0, saving_goals_1.registerDeleteSavingGoal)();
    // Notifications
    (0, notifications_1.registerNotificationHandlers)();
}
