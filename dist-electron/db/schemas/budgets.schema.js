"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgets = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const categories_schema_1 = require("./categories.schema");
exports.budgets = (0, sqlite_core_1.sqliteTable)('budgets', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryId: (0, sqlite_core_1.text)('category_id').notNull().references(() => categories_schema_1.categories.id, { onDelete: 'cascade' }),
    amountLimit: (0, sqlite_core_1.real)('amount_limit').notNull(),
    targetKind: (0, sqlite_core_1.text)('target_kind', { enum: ['maximum', 'minimum'] }).notNull().default('maximum'),
    alertPercent: (0, sqlite_core_1.real)('alert_percent').notNull().default(80),
    notes: (0, sqlite_core_1.text)('notes'),
    periodMonth: (0, sqlite_core_1.integer)('period_month').notNull(), // 1 a 12
    periodYear: (0, sqlite_core_1.integer)('period_year').notNull(),
}, (table) => ({
    // Restrição única: Impede ter mais de um teto para a mesma categoria no mesmo mês/ano
    categoryPeriodUnique: (0, sqlite_core_1.unique)('unique_category_period').on(table.categoryId, table.periodMonth, table.periodYear),
}));
