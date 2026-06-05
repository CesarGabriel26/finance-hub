import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts.schema';
import { categories } from './categories.schema';

export const transactions = sqliteTable('transactions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    originalDescription: text('original_description'), // Histórico bruto do OFX
    amount: real('amount').notNull(),
    type: text('type', { enum: ['credit', 'debit', 'transfer'] }).notNull(),
    date: text('date').notNull(), // Datas no SQLite guardadas como strings ISO ou YYYY-MM-DD
    ignored: integer('ignored', { mode: 'boolean' }).default(false),

    // Para transferências entre as contas do próprio usuário
    transferAccountId: text('transfer_account_id').references(() => accounts.id, { onDelete: 'set null' }),
    fitId: text('fit_id'), // Identificador único do OFX para evitar duplicados
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    // Índices para buscas rápidas (Extrato por data e filtragem por conta)
    dateIdx: index('idx_transactions_date').on(table.date),
    accountIdx: index('idx_transactions_account').on(table.accountId),
    fitIdIdx: index('idx_transactions_fit_id').on(table.fitId),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;