import { sqliteTable, text, real, integer, unique } from 'drizzle-orm/sqlite-core';
import { categories } from './categories.schema';

export const budgets = sqliteTable('budgets', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    amountLimit: real('amount_limit').notNull(),
    targetKind: text('target_kind', { enum: ['maximum', 'minimum'] }).notNull().default('maximum'),
    alertPercent: real('alert_percent').notNull().default(80),
    notes: text('notes'),
    periodMonth: integer('period_month').notNull(), // 1 a 12
    periodYear: integer('period_year').notNull(),
}, (table) => ({
    // Restrição única: Impede ter mais de um teto para a mesma categoria no mesmo mês/ano
    categoryPeriodUnique: unique('unique_category_period').on(table.categoryId, table.periodMonth, table.periodYear),
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
