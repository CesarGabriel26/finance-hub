import { getAccounts } from '../db/accounts/getAccounts.js';
import { getCategories } from '../db/categories/getCategories.js';
import { getMovements } from '../db/movements/getMovements.js';
import { getRecentMovements } from '../db/movements/getRecentMovements.js';
import { getBills } from '../db/bills/getBills.js';
import { getKeywordRules } from '../db/keyword_rules/getKeywordRules.js';
import { getAssets } from '../db/investments/getAssets.js';
import { getInvestmentEntries } from '../db/investments/getInvestmentEntries.js';
import { getAllInvestmentEntries } from '../db/investments/getAllInvestmentEntries.js';
import { getSettings } from '../db/settings/getSettings.js';
import { getDashboardData } from '../db/dashboard/getDashboardData.js';
import { getDashboardEvolution } from '../db/dashboard/getDashboardEvolution.js';
import { getMonthlyStats } from '../db/dashboard/getMonthlyStats.js';
import { getBudgets } from '../db/budgets/getBudgets.js';

export const syncHandlers = {
    SYNC_ACCOUNTS: async (payload) => {
        const data = await getAccounts();
        return { data, message: 'Accounts synced' }
    },
    SYNC_CATEGORIES: async (payload) => {
        const data = await getCategories();
        return { data, message: 'Categories synced' }
    },
    SYNC_MOVEMENTS: async (payload) => {
        const { accountId, period } = payload;
        const data = await getMovements(null, accountId, period);
        return { data, message: 'Movements synced' }
    },
    SYNC_BILLS: async (payload) => {
        const { type, status } = payload;
        const data = await getBills(null, type, status);
        return { data, message: 'Bills synced' }
    },
    SYNC_KEYWORD_RULES: async (payload) => {
        const data = await getKeywordRules();
        return { data, message: 'Keyword rules synced' }
    },
    SYNC_ASSETS: async (payload) => {
        const data = await getAssets();
        return { data, message: 'Assets synced' }
    },
    SYNC_INVESTMENT_ENTRIES: async (payload) => {
        const { assetId } = payload;
        const data = await getInvestmentEntries(null, assetId);
        return { data, message: 'Investment entries synced' }
    },
    SYNC_SETTINGS: async (payload) => {
        const data = await getSettings();
        return { data, message: 'Settings synced' }
    },
    SYNC_DASHBOARD_DATA: async (payload) => {
        const { period, filters } = payload;
        const data = await getDashboardData(null, period, filters);
        return { data, message: 'Dashboard data synced' }
    },
    SYNC_DASHBOARD_EVOLUTION: async (payload) => {
        const { periods, filters } = payload;
        const data = await getDashboardEvolution(null, periods, filters);
        return { data, message: 'Dashboard evolution synced' }
    },
    SYNC_RECENT_MOVEMENTS: async (payload) => {
        const { limit, filters } = payload;
        const data = await getRecentMovements(null, limit, filters);
        return { data, message: 'Recent movements synced' }
    },
    SYNC_ALL_INVESTMENT_ENTRIES: async (payload) => {
        const data = await getAllInvestmentEntries();
        return { data, message: 'All investment entries synced' }
    },
    SYNC_BUDGETS: async (payload) => {
        const { month, year } = payload;
        const data = await getBudgets(null, month, year);
        return { data, message: 'Budgets synced' }
    },
    SYNC_MONTHLY_STATS: async (payload) => {
        const { months } = payload;
        const data = await getMonthlyStats(null, months);
        return { data, message: 'Monthly stats synced' }
    },
}