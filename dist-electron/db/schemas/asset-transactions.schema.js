"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetTransactions = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const assets_schema_1 = require("./assets.schema");
const accounts_schema_1 = require("./accounts.schema");
exports.assetTransactions = (0, sqlite_core_1.sqliteTable)('asset_transactions', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    assetId: (0, sqlite_core_1.text)('asset_id').notNull().references(() => assets_schema_1.assets.id, { onDelete: 'cascade' }),
    accountId: (0, sqlite_core_1.text)('account_id').notNull().references(() => accounts_schema_1.accounts.id, { onDelete: 'restrict' }), // Impede deletar conta se houver compra de ativo associada
    type: (0, sqlite_core_1.text)('type', { enum: ['buy', 'sell', 'dividend', 'interest'] }).notNull(),
    quantity: (0, sqlite_core_1.real)('quantity').notNull(), // Suporta frações (ex: 0.0025 BTC)
    pricePerUnit: (0, sqlite_core_1.real)('price_per_unit').notNull(),
    costs: (0, sqlite_core_1.real)('costs').default(0.0), // Taxas B3, corretagem
    date: (0, sqlite_core_1.text)('date').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
});
