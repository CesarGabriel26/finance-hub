const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Accounts
    getAccounts: () => ipcRenderer.invoke('get-accounts'),
    addAccount: (account) => ipcRenderer.invoke('add-account', account),
    deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
    updateAccountBalance: (id, balance) => ipcRenderer.invoke('update-account-balance', id, balance),
    
    // Categories
    getCategories: () => ipcRenderer.invoke('get-categories'),
    addCategory: (category) => ipcRenderer.invoke('add-category', category),
    deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),

    // Movements
    getMovements: (accountId, period) => ipcRenderer.invoke('get-movements', accountId, period),
    getMovementsForReview: () => ipcRenderer.invoke('get-movements-for-review'),
    addMovement: (movement) => ipcRenderer.invoke('add-movement', movement),
    updateMovement: (id, movement) => ipcRenderer.invoke('update-movement', id, movement),
    deleteMovement: (id) => ipcRenderer.invoke('delete-movement', id),
    closePeriod: (accountId, period) => ipcRenderer.invoke('close-period', accountId, period),

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
    deleteAsset: (id) => ipcRenderer.invoke('delete-asset', id),
    getInvestmentEntries: (assetId) => ipcRenderer.invoke('get-investment-entries', assetId),
    addInvestmentEntry: (entry) => ipcRenderer.invoke('add-investment-entry', entry),
    deleteInvestmentEntry: (id) => ipcRenderer.invoke('delete-investment-entry', id),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSetting: (key, value) => ipcRenderer.invoke('update-setting', key, value),
    setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
    checkDueBills: () => ipcRenderer.invoke('check-due-bills'),
});
