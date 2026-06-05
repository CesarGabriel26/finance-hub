"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categories = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.categories = (0, sqlite_core_1.sqliteTable)('categories', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull(),
    type: (0, sqlite_core_1.text)('type', { enum: ['income', 'expense'] }).notNull(),
    isFixed: (0, sqlite_core_1.integer)('is_fixed', { mode: 'boolean' }).notNull().default(false),
    icon: (0, sqlite_core_1.text)('icon'),
    color: (0, sqlite_core_1.text)('color'),
    // Auto-relacionamento (subcategoria): aponta para a própria tabela de categorias
    parentId: (0, sqlite_core_1.text)('parent_id').references(() => exports.categories.id, { onDelete: 'set null' }),
});
