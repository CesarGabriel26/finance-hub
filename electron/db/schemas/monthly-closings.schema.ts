import { index, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const monthlyClosings = sqliteTable(
  'monthly_closings',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    period: text('period').notNull(),
    incomeTotal: real('income_total').notNull().default(0),
    expenseTotal: real('expense_total').notNull().default(0),
    balanceTotal: real('balance_total').notNull().default(0),
    investedTotal: real('invested_total').notNull().default(0),
    budgetLimitTotal: real('budget_limit_total').notNull().default(0),
    budgetSpentTotal: real('budget_spent_total').notNull().default(0),
    status: text('status', { enum: ['open', 'closed'] }).notNull().default('closed'),
    notes: text('notes'),
    closedAt: text('closed_at').$defaultFn(() => new Date().toISOString()),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    periodUnique: unique('unique_monthly_closings_period').on(table.period),
    periodIdx: index('idx_monthly_closings_period').on(table.period),
  }),
);

export type MonthlyClosing = typeof monthlyClosings.$inferSelect;
export type NewMonthlyClosing = typeof monthlyClosings.$inferInsert;
