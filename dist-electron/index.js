"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFinancialApi = initFinancialApi;
// ── Accounts ─────────────────────────────────────────────────────────────────
const accounts_1 = require("./api/accounts");
// ── Categories ────────────────────────────────────────────────────────────────
const categories_1 = require("./api/categories");
// ── Transactions ──────────────────────────────────────────────────────────────
const transactions_1 = require("./api/transactions");
// ── Budgets ───────────────────────────────────────────────────────────────────
const budgets_1 = require("./api/budgets");
// ── Assets ────────────────────────────────────────────────────────────────────
const assets_1 = require("./api/assets");
// ── Asset Transactions ────────────────────────────────────────────────────────
const asset_transactions_1 = require("./api/asset-transactions");
// ── Saving Goals ──────────────────────────────────────────────────────────────
const saving_goals_1 = require("./api/saving-goals");
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
}
