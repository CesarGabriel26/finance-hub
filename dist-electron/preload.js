"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ── App / Utilities ───────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('AppApi', {
    getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    getPlatform: () => electron_1.ipcRenderer.invoke('app:platform'),
    isElectron: true,
});
// ── Accounts ──────────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('AccountsApi', {
    getAll: (filters) => electron_1.ipcRenderer.invoke('accounts:get-all', filters),
    getById: (id) => electron_1.ipcRenderer.invoke('accounts:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('accounts:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('accounts:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('accounts:delete', id),
});
electron_1.contextBridge.exposeInMainWorld('AccountsReceivableApi', {
    getAll: (filters) => electron_1.ipcRenderer.invoke('accounts-receivable:get-all', filters),
    getById: (id) => electron_1.ipcRenderer.invoke('accounts-receivable:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('accounts-receivable:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('accounts-receivable:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('accounts-receivable:delete', id),
});
electron_1.contextBridge.exposeInMainWorld('AccountsPayableApi', {
    getAll: (filters) => electron_1.ipcRenderer.invoke('accounts-payable:get-all', filters),
    getById: (id) => electron_1.ipcRenderer.invoke('accounts-payable:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('accounts-payable:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('accounts-payable:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('accounts-payable:delete', id),
});
electron_1.contextBridge.exposeInMainWorld('AccountStatementBalancesApi', {
    getAll: (filters) => electron_1.ipcRenderer.invoke('account-statement-balances:get-all', filters),
    upsert: (data) => electron_1.ipcRenderer.invoke('account-statement-balances:upsert', data),
});
// ── Categories ────────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('CategoriesApi', {
    getAll: (filters) => electron_1.ipcRenderer.invoke('categories:get-all', filters),
    getById: (id) => electron_1.ipcRenderer.invoke('categories:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('categories:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('categories:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('categories:delete', id),
});
// ── Transactions ──────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('TransactionsApi', {
    getAll: (query) => electron_1.ipcRenderer.invoke('transactions:get-all', query),
    getById: (id) => electron_1.ipcRenderer.invoke('transactions:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('transactions:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('transactions:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('transactions:delete', id),
});
// ── Budgets ───────────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('BudgetsApi', {
    getAll: (month, year) => electron_1.ipcRenderer.invoke('budgets:get-all', month, year),
    getById: (id) => electron_1.ipcRenderer.invoke('budgets:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('budgets:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('budgets:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('budgets:delete', id),
});
// ── Assets ────────────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('AssetsApi', {
    getAll: () => electron_1.ipcRenderer.invoke('assets:get-all'),
    getById: (id) => electron_1.ipcRenderer.invoke('assets:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('assets:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('assets:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('assets:delete', id),
});
electron_1.contextBridge.exposeInMainWorld('InvestmentPortfoliosApi', {
    getAll: () => electron_1.ipcRenderer.invoke('investment-portfolios:get-all'),
    getById: (id) => electron_1.ipcRenderer.invoke('investment-portfolios:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('investment-portfolios:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('investment-portfolios:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('investment-portfolios:delete', id),
    getAssets: (portfolioId) => electron_1.ipcRenderer.invoke('investment-portfolios:get-assets', portfolioId),
    insertAsset: (data) => electron_1.ipcRenderer.invoke('investment-portfolios:insert-asset', data),
    updateAsset: (id, data) => electron_1.ipcRenderer.invoke('investment-portfolios:update-asset', id, data),
    deleteAsset: (id) => electron_1.ipcRenderer.invoke('investment-portfolios:delete-asset', id),
});
electron_1.contextBridge.exposeInMainWorld('MarketRatesApi', {
    getCache: () => electron_1.ipcRenderer.invoke('market-rates:get-cache'),
    refresh: () => electron_1.ipcRenderer.invoke('market-rates:refresh'),
});
electron_1.contextBridge.exposeInMainWorld('NotificationsApi', {
    checkDue: (options) => electron_1.ipcRenderer.invoke('notifications:check-due', options),
});
// ── Asset Transactions ────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('AssetTransactionsApi', {
    getAll: (assetId) => electron_1.ipcRenderer.invoke('asset-transactions:get-all', assetId),
    getById: (id) => electron_1.ipcRenderer.invoke('asset-transactions:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('asset-transactions:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('asset-transactions:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('asset-transactions:delete', id),
});
// ── Saving Goals ──────────────────────────────────────────────────────────────
electron_1.contextBridge.exposeInMainWorld('SavingGoalsApi', {
    getAll: () => electron_1.ipcRenderer.invoke('saving-goals:get-all'),
    getById: (id) => electron_1.ipcRenderer.invoke('saving-goals:get-by-id', id),
    insert: (data) => electron_1.ipcRenderer.invoke('saving-goals:insert', data),
    update: (id, data) => electron_1.ipcRenderer.invoke('saving-goals:update', id, data),
    delete: (id) => electron_1.ipcRenderer.invoke('saving-goals:delete', id),
});
