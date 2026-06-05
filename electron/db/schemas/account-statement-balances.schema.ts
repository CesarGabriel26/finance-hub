import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts.schema';

export const accountStatementBalances = sqliteTable('account_statement_balances', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  statementStartDate: text('statement_start_date'),
  statementEndDate: text('statement_end_date'),
  initialBalance: real('initial_balance'),
  finalBalance: real('final_balance'),
  totalCredits: real('total_credits').notNull().default(0),
  totalDebits: real('total_debits').notNull().default(0),
  netAmount: real('net_amount').notNull().default(0),
  transactionCount: integer('transaction_count').notNull().default(0),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  fileName: text('file_name'),
  importedAt: text('imported_at').$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
}, (table) => ({
  accountPeriodUnique: unique('unique_statement_balance_account_period')
    .on(table.accountId, table.period),
  accountIdx: index('idx_statement_balances_account').on(table.accountId),
  periodIdx: index('idx_statement_balances_period').on(table.period),
}));

export type AccountStatementBalance = typeof accountStatementBalances.$inferSelect;
export type NewAccountStatementBalance = typeof accountStatementBalances.$inferInsert;
