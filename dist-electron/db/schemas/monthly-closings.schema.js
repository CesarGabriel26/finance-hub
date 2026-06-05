"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyClosings = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.monthlyClosings = (0, sqlite_core_1.sqliteTable)('monthly_closings', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    period: (0, sqlite_core_1.text)('period').notNull(),
    incomeTotal: (0, sqlite_core_1.real)('income_total').notNull().default(0),
    expenseTotal: (0, sqlite_core_1.real)('expense_total').notNull().default(0),
    balanceTotal: (0, sqlite_core_1.real)('balance_total').notNull().default(0),
    investedTotal: (0, sqlite_core_1.real)('invested_total').notNull().default(0),
    budgetLimitTotal: (0, sqlite_core_1.real)('budget_limit_total').notNull().default(0),
    budgetSpentTotal: (0, sqlite_core_1.real)('budget_spent_total').notNull().default(0),
    status: (0, sqlite_core_1.text)('status', { enum: ['open', 'closed'] }).notNull().default('closed'),
    notes: (0, sqlite_core_1.text)('notes'),
    closedAt: (0, sqlite_core_1.text)('closed_at').$defaultFn(() => new Date().toISOString()),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at'),
}, (table) => ({
    periodUnique: (0, sqlite_core_1.unique)('unique_monthly_closings_period').on(table.period),
    periodIdx: (0, sqlite_core_1.index)('idx_monthly_closings_period').on(table.period),
}));
