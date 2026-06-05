import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const investmentPortfolios = sqliteTable('investment_portfolios', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  strategy: text('strategy', {
    enum: ['income', 'growth', 'balanced', 'capital_preservation', 'custom'],
  }).notNull().default('balanced'),
  riskProfile: text('risk_profile', {
    enum: ['conservative', 'moderate', 'aggressive'],
  }).notNull().default('moderate'),
  benchmark: text('benchmark').default('CDI'),
  currency: text('currency').notNull().default('BRL'),
  beginnerMode: integer('beginner_mode', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const investmentPortfolioAssets = sqliteTable(
  'investment_portfolio_assets',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    portfolioId: text('portfolio_id')
      .notNull()
      .references(() => investmentPortfolios.id, { onDelete: 'cascade' }),
    ticker: text('ticker').notNull(),
    name: text('name').notNull(),
    type: text('type', {
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
    broker: text('broker'),
    sector: text('sector'),
    currency: text('currency').notNull().default('BRL'),
    quantity: real('quantity').notNull(),
    averagePrice: real('average_price').notNull(),
    currentPrice: real('current_price').notNull(),
    purchaseDate: text('purchase_date'),
    targetAllocation: real('target_allocation').default(0).notNull(),
    dividendYield: real('dividend_yield').default(0).notNull(),
    annualIncome: real('annual_income').default(0).notNull(),
    fixedIncomeIndexer: text('fixed_income_indexer', {
      enum: ['cdi', 'selic', 'ipca', 'prefixed', 'igpm', 'other'],
    }),
    fixedIncomeRateType: text('fixed_income_rate_type', {
      enum: ['percent_indexer', 'indexer_plus', 'annual'],
    }),
    fixedIncomeRate: real('fixed_income_rate'),
    fixedIncomeMaturityDate: text('fixed_income_maturity_date'),
    fixedIncomeLiquidity: text('fixed_income_liquidity', {
      enum: ['daily', 'maturity', 'custom'],
    }),
    fixedIncomeInvestedAmount: real('fixed_income_invested_amount'),
    fixedIncomeGrossAmount: real('fixed_income_gross_amount'),
    fixedIncomeNetAmount: real('fixed_income_net_amount'),
    fixedIncomeTaxExempt: integer('fixed_income_tax_exempt', { mode: 'boolean' }).default(false),
    notes: text('notes'),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    portfolioIdx: index('idx_investment_portfolio_assets_portfolio').on(table.portfolioId),
    tickerIdx: index('idx_investment_portfolio_assets_ticker').on(table.ticker),
    typeIdx: index('idx_investment_portfolio_assets_type').on(table.type),
  }),
);

export type InvestmentPortfolio = typeof investmentPortfolios.$inferSelect;
export type NewInvestmentPortfolio = typeof investmentPortfolios.$inferInsert;

export type InvestmentPortfolioAsset = typeof investmentPortfolioAssets.$inferSelect;
export type NewInvestmentPortfolioAsset = typeof investmentPortfolioAssets.$inferInsert;
