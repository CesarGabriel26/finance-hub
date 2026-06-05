import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const assets = sqliteTable('assets', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    ticker: text('ticker').notNull().unique(), // Ex: 'HGLG11', 'PETR4', 'CDB_INTER'
    name: text('name').notNull(),
    type: text('type', { enum: ['fii', 'stock', 'cdb', 'treasury', 'crypto'] }).notNull(),
    institution: text('institution'), // Onde está guardado (NuInvest, XP, Inter)
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;