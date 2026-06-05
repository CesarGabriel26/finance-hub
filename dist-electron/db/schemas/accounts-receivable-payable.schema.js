"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsPayable = exports.accountsReceivable = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const accounts_schema_1 = require("./accounts.schema");
const categories_schema_1 = require("./categories.schema");
exports.accountsReceivable = (0, sqlite_core_1.sqliteTable)('accounts_receivable', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    description: (0, sqlite_core_1.text)('description').notNull(),
    payer: (0, sqlite_core_1.text)('payer').notNull().default(''),
    amount: (0, sqlite_core_1.real)('amount').notNull(),
    dueDate: (0, sqlite_core_1.text)('due_date').notNull(),
    receivedAt: (0, sqlite_core_1.text)('received_at'),
    status: (0, sqlite_core_1.text)('status', { enum: ['pending', 'received', 'overdue', 'canceled'] })
        .notNull()
        .default('pending'),
    accountId: (0, sqlite_core_1.text)('account_id').references(() => accounts_schema_1.accounts.id, { onDelete: 'set null' }),
    categoryId: (0, sqlite_core_1.text)('category_id').references(() => categories_schema_1.categories.id, { onDelete: 'set null' }),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    dueDateIdx: (0, sqlite_core_1.index)('idx_accounts_receivable_due_date').on(table.dueDate),
    statusIdx: (0, sqlite_core_1.index)('idx_accounts_receivable_status').on(table.status),
}));
exports.accountsPayable = (0, sqlite_core_1.sqliteTable)('accounts_payable', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    description: (0, sqlite_core_1.text)('description').notNull(),
    payee: (0, sqlite_core_1.text)('payee').notNull().default(''),
    amount: (0, sqlite_core_1.real)('amount').notNull(),
    dueDate: (0, sqlite_core_1.text)('due_date').notNull(),
    paidAt: (0, sqlite_core_1.text)('paid_at'),
    status: (0, sqlite_core_1.text)('status', { enum: ['pending', 'paid', 'overdue', 'canceled'] })
        .notNull()
        .default('pending'),
    accountId: (0, sqlite_core_1.text)('account_id').references(() => accounts_schema_1.accounts.id, { onDelete: 'set null' }),
    categoryId: (0, sqlite_core_1.text)('category_id').references(() => categories_schema_1.categories.id, { onDelete: 'set null' }),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    dueDateIdx: (0, sqlite_core_1.index)('idx_accounts_payable_due_date').on(table.dueDate),
    statusIdx: (0, sqlite_core_1.index)('idx_accounts_payable_status').on(table.status),
}));
