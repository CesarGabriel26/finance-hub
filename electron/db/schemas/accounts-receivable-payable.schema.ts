import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts.schema';
import { categories } from './categories.schema';

export const accountsReceivable = sqliteTable(
  'accounts_receivable',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    description: text('description').notNull(),
    payer: text('payer').notNull().default(''),
    amount: real('amount').notNull(),
    dueDate: text('due_date').notNull(),
    receivedAt: text('received_at'),
    status: text('status', { enum: ['pending', 'received', 'overdue', 'canceled'] })
      .notNull()
      .default('pending'),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
    recurrenceClassification: text('recurrence_classification', {
      enum: ['fixed', 'variable'],
    }),
    totalInstallments: integer('total_installments').notNull().default(1),
    currentInstallment: integer('current_installment').notNull().default(1),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    settlementTransactionId: text('settlement_transaction_id'),
    notes: text('notes'),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    dueDateIdx: index('idx_accounts_receivable_due_date').on(table.dueDate),
    statusIdx: index('idx_accounts_receivable_status').on(table.status),
  }),
);

export const accountsPayable = sqliteTable(
  'accounts_payable',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    description: text('description').notNull(),
    payee: text('payee').notNull().default(''),
    amount: real('amount').notNull(),
    dueDate: text('due_date').notNull(),
    paidAt: text('paid_at'),
    status: text('status', { enum: ['pending', 'paid', 'overdue', 'canceled'] })
      .notNull()
      .default('pending'),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
    recurrenceClassification: text('recurrence_classification', {
      enum: ['fixed', 'variable'],
    }),
    totalInstallments: integer('total_installments').notNull().default(1),
    currentInstallment: integer('current_installment').notNull().default(1),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    settlementTransactionId: text('settlement_transaction_id'),
    notes: text('notes'),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    dueDateIdx: index('idx_accounts_payable_due_date').on(table.dueDate),
    statusIdx: index('idx_accounts_payable_status').on(table.status),
  }),
);

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type NewAccountReceivable = typeof accountsReceivable.$inferInsert;

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type NewAccountPayable = typeof accountsPayable.$inferInsert;
