import { integer, sqliteTable, text, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    type: text('type', { enum: ['income', 'expense'] }).notNull(),
    isFixed: integer('is_fixed', { mode: 'boolean' }).notNull().default(false),
    icon: text('icon'),
    color: text('color'),
    // Auto-relacionamento (subcategoria): aponta para a própria tabela de categorias
    parentId: text('parent_id').references((): AnySQLiteColumn => categories.id, { onDelete: 'set null' }),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
