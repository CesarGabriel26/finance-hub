import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    type: text('type', { enum: ['checking', 'savings', 'cash', 'investment'] }).notNull(),
    bankCode: text('bank_code').notNull().default(''),
    accountNumber: text('account_number').notNull().default(''),
    balance: real('balance').default(0.0),
    color: text('color'),
    icon: text('icon'),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
