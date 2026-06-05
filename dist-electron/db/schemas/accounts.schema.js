"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accounts = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.accounts = (0, sqlite_core_1.sqliteTable)('accounts', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull(),
    type: (0, sqlite_core_1.text)('type', { enum: ['checking', 'savings', 'cash', 'investment'] }).notNull(),
    bankCode: (0, sqlite_core_1.text)('bank_code').notNull().default(''),
    accountNumber: (0, sqlite_core_1.text)('account_number').notNull().default(''),
    balance: (0, sqlite_core_1.real)('balance').default(0.0),
    color: (0, sqlite_core_1.text)('color'),
    icon: (0, sqlite_core_1.text)('icon'),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
});
