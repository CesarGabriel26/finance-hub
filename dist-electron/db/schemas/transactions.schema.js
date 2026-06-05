"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const accounts_schema_1 = require("./accounts.schema");
const categories_schema_1 = require("./categories.schema");
exports.transactions = (0, sqlite_core_1.sqliteTable)('transactions', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: (0, sqlite_core_1.text)('account_id').notNull().references(() => accounts_schema_1.accounts.id, { onDelete: 'cascade' }),
    categoryId: (0, sqlite_core_1.text)('category_id').references(() => categories_schema_1.categories.id, { onDelete: 'set null' }),
    description: (0, sqlite_core_1.text)('description').notNull(),
    originalDescription: (0, sqlite_core_1.text)('original_description'), // Histórico bruto do OFX
    amount: (0, sqlite_core_1.real)('amount').notNull(),
    type: (0, sqlite_core_1.text)('type', { enum: ['credit', 'debit', 'transfer'] }).notNull(),
    date: (0, sqlite_core_1.text)('date').notNull(), // Datas no SQLite guardadas como strings ISO ou YYYY-MM-DD
    ignored: (0, sqlite_core_1.integer)('ignored', { mode: 'boolean' }).default(false),
    tags: (0, sqlite_core_1.text)('tags').notNull().default(''),
    // Para transferências entre as contas do próprio usuário
    transferAccountId: (0, sqlite_core_1.text)('transfer_account_id').references(() => accounts_schema_1.accounts.id, { onDelete: 'set null' }),
    fitId: (0, sqlite_core_1.text)('fit_id'), // Identificador único do OFX para evitar duplicados
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    // Índices para buscas rápidas (Extrato por data e filtragem por conta)
    dateIdx: (0, sqlite_core_1.index)('idx_transactions_date').on(table.date),
    accountIdx: (0, sqlite_core_1.index)('idx_transactions_account').on(table.accountId),
    fitIdIdx: (0, sqlite_core_1.index)('idx_transactions_fit_id').on(table.fitId),
}));
