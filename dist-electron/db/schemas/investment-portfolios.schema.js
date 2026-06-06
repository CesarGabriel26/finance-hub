"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentAssetSnapshots = exports.investmentPortfolioAssets = exports.investmentPortfolios = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.investmentPortfolios = (0, sqlite_core_1.sqliteTable)('investment_portfolios', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull(),
    strategy: (0, sqlite_core_1.text)('strategy', {
        enum: ['income', 'growth', 'balanced', 'capital_preservation', 'global_diversification', 'custom'],
    }).notNull().default('balanced'),
    riskProfile: (0, sqlite_core_1.text)('risk_profile', {
        enum: ['conservative', 'moderate', 'aggressive'],
    }).notNull().default('moderate'),
    benchmark: (0, sqlite_core_1.text)('benchmark').default('CDI'),
    currency: (0, sqlite_core_1.text)('currency').notNull().default('BRL'),
    beginnerMode: (0, sqlite_core_1.integer)('beginner_mode', { mode: 'boolean' }).notNull().default(false),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at').$defaultFn(() => new Date().toISOString()),
});
exports.investmentPortfolioAssets = (0, sqlite_core_1.sqliteTable)('investment_portfolio_assets', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    portfolioId: (0, sqlite_core_1.text)('portfolio_id')
        .notNull()
        .references(() => exports.investmentPortfolios.id, { onDelete: 'cascade' }),
    ticker: (0, sqlite_core_1.text)('ticker').notNull(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    type: (0, sqlite_core_1.text)('type', {
        enum: [
            'stock',
            'fii',
            'etf',
            'bdr',
            'reit',
            'international_stock',
            'cdb',
            'lci_lca',
            'treasury',
            'crypto',
            'fund',
            'other',
        ],
    }).notNull(),
    broker: (0, sqlite_core_1.text)('broker'),
    sector: (0, sqlite_core_1.text)('sector'),
    currency: (0, sqlite_core_1.text)('currency').notNull().default('BRL'),
    quantity: (0, sqlite_core_1.real)('quantity').notNull(),
    averagePrice: (0, sqlite_core_1.real)('average_price').notNull(),
    currentPrice: (0, sqlite_core_1.real)('current_price').notNull(),
    purchaseDate: (0, sqlite_core_1.text)('purchase_date'),
    targetAllocation: (0, sqlite_core_1.real)('target_allocation').default(0).notNull(),
    dividendYield: (0, sqlite_core_1.real)('dividend_yield').default(0).notNull(),
    annualIncome: (0, sqlite_core_1.real)('annual_income').default(0).notNull(),
    fixedIncomeIndexer: (0, sqlite_core_1.text)('fixed_income_indexer', {
        enum: ['cdi', 'selic', 'ipca', 'prefixed', 'igpm', 'other'],
    }),
    fixedIncomeRateType: (0, sqlite_core_1.text)('fixed_income_rate_type', {
        enum: ['percent_indexer', 'indexer_plus', 'annual'],
    }),
    fixedIncomeRate: (0, sqlite_core_1.real)('fixed_income_rate'),
    fixedIncomeMaturityDate: (0, sqlite_core_1.text)('fixed_income_maturity_date'),
    fixedIncomeLiquidity: (0, sqlite_core_1.text)('fixed_income_liquidity', {
        enum: ['daily', 'maturity', 'custom'],
    }),
    fixedIncomeInvestedAmount: (0, sqlite_core_1.real)('fixed_income_invested_amount'),
    fixedIncomeGrossAmount: (0, sqlite_core_1.real)('fixed_income_gross_amount'),
    fixedIncomeNetAmount: (0, sqlite_core_1.real)('fixed_income_net_amount'),
    fixedIncomeTaxExempt: (0, sqlite_core_1.integer)('fixed_income_tax_exempt', { mode: 'boolean' }).default(false),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    portfolioIdx: (0, sqlite_core_1.index)('idx_investment_portfolio_assets_portfolio').on(table.portfolioId),
    tickerIdx: (0, sqlite_core_1.index)('idx_investment_portfolio_assets_ticker').on(table.ticker),
    typeIdx: (0, sqlite_core_1.index)('idx_investment_portfolio_assets_type').on(table.type),
}));
exports.investmentAssetSnapshots = (0, sqlite_core_1.sqliteTable)('investment_asset_snapshots', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    assetId: (0, sqlite_core_1.text)('asset_id')
        .notNull()
        .references(() => exports.investmentPortfolioAssets.id, { onDelete: 'cascade' }),
    portfolioId: (0, sqlite_core_1.text)('portfolio_id')
        .notNull()
        .references(() => exports.investmentPortfolios.id, { onDelete: 'cascade' }),
    snapshotDate: (0, sqlite_core_1.text)('snapshot_date').notNull(),
    investedAmount: (0, sqlite_core_1.real)('invested_amount').notNull().default(0),
    grossAmount: (0, sqlite_core_1.real)('gross_amount').notNull().default(0),
    netAmount: (0, sqlite_core_1.real)('net_amount').notNull().default(0),
    resultAmount: (0, sqlite_core_1.real)('result_amount').notNull().default(0),
    quantity: (0, sqlite_core_1.real)('quantity').notNull().default(0),
    currentPrice: (0, sqlite_core_1.real)('current_price').notNull().default(0),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    assetDateUnique: (0, sqlite_core_1.unique)('unique_investment_asset_snapshot_date').on(table.assetId, table.snapshotDate),
    assetIdx: (0, sqlite_core_1.index)('idx_investment_asset_snapshots_asset').on(table.assetId),
    portfolioIdx: (0, sqlite_core_1.index)('idx_investment_asset_snapshots_portfolio').on(table.portfolioId),
    dateIdx: (0, sqlite_core_1.index)('idx_investment_asset_snapshots_date').on(table.snapshotDate),
}));
