const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Accounts
    getAccounts: () => ipcRenderer.invoke('get-accounts'),
    addAccount: (account) => ipcRenderer.invoke('add-account', account),
    deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
    updateAccountBalance: (id, balance) => ipcRenderer.invoke('update-account-balance', id, balance),
    updateAccountName: (id, name) => ipcRenderer.invoke('update-account-name', id, name),
    
    // Categories
    getCategories: () => ipcRenderer.invoke('get-categories'),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

    getMovements: (accountId, period) => ipcRenderer.invoke('get-movements', accountId, period),
    getMovementsForReview: () => ipcRenderer.invoke('get-movements-for-review'),
    addMovement: (movement, skipRecalculation) => ipcRenderer.invoke('add-movement', movement, skipRecalculation),
    updateMovement: (id, movement, skipRecalculation) => ipcRenderer.invoke('update-movement', id, movement, skipRecalculation),
    deleteMovement: (id, skipRecalculation) => ipcRenderer.invoke('delete-movement', id, skipRecalculation),
    closePeriod: (accountId, period) => ipcRenderer.invoke('close-period', accountId, period),
    recalculateBalance: (accountId) => ipcRenderer.invoke('recalculate-balance', accountId),

    // Keywords
    getKeywords: () => ipcRenderer.invoke('get-keywords'),
    addKeyword: (keyword, categoryId) => ipcRenderer.invoke('add-keyword', keyword, categoryId),
    deleteKeyword: (id) => ipcRenderer.invoke('delete-keyword', id),
    
    // Keyword Rules
    getKeywordRules: () => ipcRenderer.invoke('get-keyword-rules'),
    addKeywordRule: (rule) => ipcRenderer.invoke('add-keyword-rule', rule),
    deleteKeywordRule: (id) => ipcRenderer.invoke('delete-keyword-rule', id),

    // Bills
    getBills: (type, status) => ipcRenderer.invoke('get-bills', type, status),
    addBill: (bill) => ipcRenderer.invoke('add-bill', bill),
    deleteBill: (id) => ipcRenderer.invoke('delete-bill', id),
    payBill: (data) => ipcRenderer.invoke('pay-bill', data),

    // Investments
    getAssets: () => ipcRenderer.invoke('get-assets'),
    addAsset: (asset) => ipcRenderer.invoke('add-asset', asset),
    updateAsset: (id, asset) => ipcRenderer.invoke('update-asset', id, asset),
    deleteAsset: (id) => ipcRenderer.invoke('delete-asset', id),
    getInvestmentEntries: (assetId) => ipcRenderer.invoke('get-investment-entries', assetId),
    getAllInvestmentEntries: () => ipcRenderer.invoke('get-all-investment-entries'),
    addInvestmentEntry: (entry) => ipcRenderer.invoke('add-investment-entry', entry),
    deleteInvestmentEntry: (id) => ipcRenderer.invoke('delete-investment-entry', id),
    getMonthlyStats: (months) => ipcRenderer.invoke('get-monthly-stats', months),
    
    // Dashboard
    getDashboardData: (period, filters) => ipcRenderer.invoke('get-dashboard-data', period, filters),
    getDashboardEvolution: (periods, filters) => ipcRenderer.invoke('get-dashboard-evolution', periods, filters),
    getRecentMovements: (limit, filters) => ipcRenderer.invoke('get-recent-movements', limit, filters),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSetting: (key, value) => ipcRenderer.invoke('update-setting', key, value),
    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
    checkDueBills: () => ipcRenderer.invoke('check-due-bills'),

    recategorizeMovements: () => ipcRenderer.invoke('recategorize-movements'),

    // Auto Update
    checkUpdate: () => ipcRenderer.invoke('check-update'),
    startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateEvent: (callback) => ipcRenderer.on('update-event', (_event, data) => callback(data)),
    removeUpdateEvent: () => ipcRenderer.removeAllListeners('update-event'),

    getBudgets: () => ipcRenderer.invoke('get-budgets'),
    addBudget: (budget) => ipcRenderer.invoke('add-budget', budget),
    updateBudget: (id, budget) => ipcRenderer.invoke('update-budget', id, budget),
    deleteBudget: (id) => ipcRenderer.invoke('delete-budget', id),
    
    // Cloud/Local Backup
    getBackupSettings: () => ipcRenderer.invoke('get-backup-settings'),
    setBackupSettings: (settings) => ipcRenderer.invoke('set-backup-settings', settings),
    backupNow: () => ipcRenderer.invoke('backup-now'),
    restoreBackup: (filePath) => ipcRenderer.invoke('restore-backup', filePath),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
});
