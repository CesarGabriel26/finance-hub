import { contextBridge, ipcRenderer } from 'electron';

// ── App / Utilities ───────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('AppApi', {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getPlatform: (): Promise<string> => ipcRenderer.invoke('app:platform'),
  isElectron: true,
});

// ── Accounts ──────────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('AccountsApi', {
  getAll: (filters?: { type?: string, name?: string }) => ipcRenderer.invoke('accounts:get-all', filters),
  getById: (id: string) => ipcRenderer.invoke('accounts:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('accounts:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('accounts:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('accounts:delete', id),
});

contextBridge.exposeInMainWorld('AccountsReceivableApi', {
  getAll: (filters?: unknown) => ipcRenderer.invoke('accounts-receivable:get-all', filters),
  getById: (id: string) => ipcRenderer.invoke('accounts-receivable:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('accounts-receivable:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('accounts-receivable:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('accounts-receivable:delete', id),
});

contextBridge.exposeInMainWorld('AccountsPayableApi', {
  getAll: (filters?: unknown) => ipcRenderer.invoke('accounts-payable:get-all', filters),
  getById: (id: string) => ipcRenderer.invoke('accounts-payable:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('accounts-payable:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('accounts-payable:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('accounts-payable:delete', id),
});

contextBridge.exposeInMainWorld('AccountStatementBalancesApi', {
  getAll: (filters?: unknown) => ipcRenderer.invoke('account-statement-balances:get-all', filters),
  upsert: (data: unknown) => ipcRenderer.invoke('account-statement-balances:upsert', data),
});

// ── Categories ────────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('CategoriesApi', {
  getAll: (filters?: { type?: string, name?: string }) => ipcRenderer.invoke('categories:get-all', filters),
  getById: (id: string) => ipcRenderer.invoke('categories:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('categories:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('categories:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('categories:delete', id),
});

contextBridge.exposeInMainWorld('CategoryRulesApi', {
  getAll: () => ipcRenderer.invoke('category-rules:get-all'),
  insert: (data: unknown) => ipcRenderer.invoke('category-rules:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('category-rules:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('category-rules:delete', id),
});

// ── Transactions ──────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('TransactionsApi', {
  getAll: (query?: unknown) => ipcRenderer.invoke('transactions:get-all', query),
  getById: (id: string) => ipcRenderer.invoke('transactions:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('transactions:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('transactions:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('transactions:delete', id),
});

// ── Budgets ───────────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('BudgetsApi', {
  getAll: (month: number, year: number) => ipcRenderer.invoke('budgets:get-all', month, year),
  getById: (id: string) => ipcRenderer.invoke('budgets:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('budgets:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('budgets:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('budgets:delete', id),
});

// ── Assets ────────────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('AssetsApi', {
  getAll: () => ipcRenderer.invoke('assets:get-all'),
  getById: (id: string) => ipcRenderer.invoke('assets:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('assets:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('assets:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('assets:delete', id),
});

contextBridge.exposeInMainWorld('InvestmentPortfoliosApi', {
  getAll: () => ipcRenderer.invoke('investment-portfolios:get-all'),
  getById: (id: string) => ipcRenderer.invoke('investment-portfolios:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('investment-portfolios:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('investment-portfolios:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('investment-portfolios:delete', id),
  getAssets: (portfolioId: string) => ipcRenderer.invoke('investment-portfolios:get-assets', portfolioId),
  insertAsset: (data: unknown) => ipcRenderer.invoke('investment-portfolios:insert-asset', data),
  updateAsset: (id: string, data: unknown) => ipcRenderer.invoke('investment-portfolios:update-asset', id, data),
  deleteAsset: (id: string) => ipcRenderer.invoke('investment-portfolios:delete-asset', id),
  getAssetSnapshots: (portfolioId: string) => ipcRenderer.invoke('investment-portfolios:get-asset-snapshots', portfolioId),
  insertAssetSnapshot: (data: unknown) => ipcRenderer.invoke('investment-portfolios:insert-asset-snapshot', data),
});

contextBridge.exposeInMainWorld('MarketRatesApi', {
  getCache: () => ipcRenderer.invoke('market-rates:get-cache'),
  refresh: () => ipcRenderer.invoke('market-rates:refresh'),
});

contextBridge.exposeInMainWorld('NotificationsApi', {
  checkDue: (options?: unknown) => ipcRenderer.invoke('notifications:check-due', options),
});

// ── Asset Transactions ────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('AssetTransactionsApi', {
  getAll: (assetId: string) => ipcRenderer.invoke('asset-transactions:get-all', assetId),
  getById: (id: string) => ipcRenderer.invoke('asset-transactions:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('asset-transactions:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('asset-transactions:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('asset-transactions:delete', id),
});

// ── Saving Goals ──────────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('SavingGoalsApi', {
  getAll: () => ipcRenderer.invoke('saving-goals:get-all'),
  getById: (id: string) => ipcRenderer.invoke('saving-goals:get-by-id', id),
  insert: (data: unknown) => ipcRenderer.invoke('saving-goals:insert', data),
  update: (id: string, data: unknown) => ipcRenderer.invoke('saving-goals:update', id, data),
  delete: (id: string) => ipcRenderer.invoke('saving-goals:delete', id),
});

contextBridge.exposeInMainWorld('MonthlyClosingsApi', {
  getAll: () => ipcRenderer.invoke('monthly-closings:get-all'),
  upsert: (data: unknown) => ipcRenderer.invoke('monthly-closings:upsert', data),
});

contextBridge.exposeInMainWorld('AccountReconciliationsApi', {
  getAll: (period?: string) => ipcRenderer.invoke('account-reconciliations:get-all', period),
  upsert: (data: unknown) => ipcRenderer.invoke('account-reconciliations:upsert', data),
});

contextBridge.exposeInMainWorld('MaintenanceApi', {
  backup: () => ipcRenderer.invoke('maintenance:backup'),
  restore: () => ipcRenderer.invoke('maintenance:restore'),
});
