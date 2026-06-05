"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountStatementBalances = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const accounts_schema_1 = require("./accounts.schema");
exports.accountStatementBalances = (0, sqlite_core_1.sqliteTable)('account_statement_balances', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: (0, sqlite_core_1.text)('account_id').notNull().references(() => accounts_schema_1.accounts.id, { onDelete: 'cascade' }),
    period: (0, sqlite_core_1.text)('period').notNull(),
    statementStartDate: (0, sqlite_core_1.text)('statement_start_date'),
    statementEndDate: (0, sqlite_core_1.text)('statement_end_date'),
    initialBalance: (0, sqlite_core_1.real)('initial_balance'),
    finalBalance: (0, sqlite_core_1.real)('final_balance'),
    totalCredits: (0, sqlite_core_1.real)('total_credits').notNull().default(0),
    totalDebits: (0, sqlite_core_1.real)('total_debits').notNull().default(0),
    netAmount: (0, sqlite_core_1.real)('net_amount').notNull().default(0),
    transactionCount: (0, sqlite_core_1.integer)('transaction_count').notNull().default(0),
    bankName: (0, sqlite_core_1.text)('bank_name'),
    accountNumber: (0, sqlite_core_1.text)('account_number'),
    fileName: (0, sqlite_core_1.text)('file_name'),
    importedAt: (0, sqlite_core_1.text)('imported_at').$defaultFn(() => new Date().toISOString()),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at'),
}, (table) => ({
    accountPeriodUnique: (0, sqlite_core_1.unique)('unique_statement_balance_account_period')
        .on(table.accountId, table.period),
    accountIdx: (0, sqlite_core_1.index)('idx_statement_balances_account').on(table.accountId),
    periodIdx: (0, sqlite_core_1.index)('idx_statement_balances_period').on(table.period),
}));
