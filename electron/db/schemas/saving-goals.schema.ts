import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { accounts } from './accounts.schema';

export const savingGoals = sqliteTable('saving_goals', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(), // Ex: "Trocar de Carro", "Reserva de Emergência"
    description: text('description'),

    targetAmount: real('target_amount').notNull(), // Quanto ele quer juntar (Ex: 10000.00)
    currentAmount: real('current_amount').default(0.0).notNull(), // Quanto já tem poupado (Ex: 2500.00)

    targetDate: text('target_date'), // Data limite no formato YYYY-MM-DD (Opcional)

    // Opcional: Vincula a meta a uma conta/caixinha específica de investimento ou poupança
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),

    status: text('status', { enum: ['active', 'completed', 'paused'] }).default('active').notNull(),
    icon: text('icon').default('savings'), // Ícone para renderizar na UI (Ex: 'home', 'flight')
    color: text('color'), // Cor customizada para a barra de progresso da meta

    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    // Índice para acelerar a listagem de metas ativas na tela do usuário
    statusIdx: index('idx_saving_goals_status').on(table.status),
}));

export type SavingGoal = typeof savingGoals.$inferSelect;
export type NewSavingGoal = typeof savingGoals.$inferInsert;