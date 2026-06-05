"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountReconciliations = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const accounts_schema_1 = require("./accounts.schema");
exports.accountReconciliations = (0, sqlite_core_1.sqliteTable)('account_reconciliations', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: (0, sqlite_core_1.text)('account_id').notNull().references(() => accounts_schema_1.accounts.id, { onDelete: 'cascade' }),
    period: (0, sqlite_core_1.text)('period').notNull(),
    systemBalance: (0, sqlite_core_1.real)('system_balance').notNull().default(0),
    statementBalance: (0, sqlite_core_1.real)('statement_balance'),
    realBalance: (0, sqlite_core_1.real)('real_balance').notNull().default(0),
    difference: (0, sqlite_core_1.real)('difference').notNull().default(0),
    status: (0, sqlite_core_1.text)('status', { enum: ['pending', 'matched', 'difference'] }).notNull().default('pending'),
    notes: (0, sqlite_core_1.text)('notes'),
    reconciledAt: (0, sqlite_core_1.text)('reconciled_at').$defaultFn(() => new Date().toISOString()),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at'),
}, (table) => ({
    accountPeriodUnique: (0, sqlite_core_1.unique)('unique_account_reconciliation_period').on(table.accountId, table.period),
    accountIdx: (0, sqlite_core_1.index)('idx_account_reconciliations_account').on(table.accountId),
    periodIdx: (0, sqlite_core_1.index)('idx_account_reconciliations_period').on(table.period),
}));
