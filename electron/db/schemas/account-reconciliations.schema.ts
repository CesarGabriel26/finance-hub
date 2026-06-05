import { index, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts.schema';

export const accountReconciliations = sqliteTable(
  'account_reconciliations',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    systemBalance: real('system_balance').notNull().default(0),
    statementBalance: real('statement_balance'),
    realBalance: real('real_balance').notNull().default(0),
    difference: real('difference').notNull().default(0),
    status: text('status', { enum: ['pending', 'matched', 'difference'] }).notNull().default('pending'),
    notes: text('notes'),
    reconciledAt: text('reconciled_at').$defaultFn(() => new Date().toISOString()),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    accountPeriodUnique: unique('unique_account_reconciliation_period').on(table.accountId, table.period),
    accountIdx: index('idx_account_reconciliations_account').on(table.accountId),
    periodIdx: index('idx_account_reconciliations_period').on(table.period),
  }),
);

export type AccountReconciliation = typeof accountReconciliations.$inferSelect;
export type NewAccountReconciliation = typeof accountReconciliations.$inferInsert;
