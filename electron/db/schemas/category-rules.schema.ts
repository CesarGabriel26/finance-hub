import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { categories } from './categories.schema';

export const categoryRules = sqliteTable(
  'category_rules',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    keyword: text('keyword').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    priority: integer('priority').notNull().default(0),
    createdByUser: integer('created_by_user', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    keywordUnique: unique('unique_category_rules_keyword').on(table.keyword),
    keywordIdx: index('idx_category_rules_keyword').on(table.keyword),
    categoryIdx: index('idx_category_rules_category').on(table.categoryId),
  }),
);

export type CategoryRule = typeof categoryRules.$inferSelect;
export type NewCategoryRule = typeof categoryRules.$inferInsert;
