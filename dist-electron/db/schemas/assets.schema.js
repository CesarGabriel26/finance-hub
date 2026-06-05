"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assets = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.assets = (0, sqlite_core_1.sqliteTable)('assets', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: (0, sqlite_core_1.text)('ticker').notNull().unique(), // Ex: 'HGLG11', 'PETR4', 'CDB_INTER'
    name: (0, sqlite_core_1.text)('name').notNull(),
    type: (0, sqlite_core_1.text)('type', { enum: ['fii', 'stock', 'cdb', 'treasury', 'crypto'] }).notNull(),
    institution: (0, sqlite_core_1.text)('institution'), // Onde está guardado (NuInvest, XP, Inter)
});
