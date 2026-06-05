import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { assets } from './assets.schema';
import { accounts } from './accounts.schema';

export const assetTransactions = sqliteTable('asset_transactions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    assetId: text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }), // Impede deletar conta se houver compra de ativo associada
    type: text('type', { enum: ['buy', 'sell', 'dividend', 'interest'] }).notNull(),
    quantity: real('quantity').notNull(), // Suporta frações (ex: 0.0025 BTC)
    pricePerUnit: real('price_per_unit').notNull(),
    costs: real('costs').default(0.0), // Taxas B3, corretagem
    date: text('date').notNull(),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type NewAssetTransaction = typeof assetTransactions.$inferInsert;