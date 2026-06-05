"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRules = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const categories_schema_1 = require("./categories.schema");
exports.categoryRules = (0, sqlite_core_1.sqliteTable)('category_rules', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    keyword: (0, sqlite_core_1.text)('keyword').notNull(),
    categoryId: (0, sqlite_core_1.text)('category_id')
        .notNull()
        .references(() => categories_schema_1.categories.id, { onDelete: 'cascade' }),
    priority: (0, sqlite_core_1.integer)('priority').notNull().default(0),
    createdByUser: (0, sqlite_core_1.integer)('created_by_user', { mode: 'boolean' }).notNull().default(true),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: (0, sqlite_core_1.text)('updated_at'),
}, (table) => ({
    keywordUnique: (0, sqlite_core_1.unique)('unique_category_rules_keyword').on(table.keyword),
    keywordIdx: (0, sqlite_core_1.index)('idx_category_rules_keyword').on(table.keyword),
    categoryIdx: (0, sqlite_core_1.index)('idx_category_rules_category').on(table.categoryId),
}));
