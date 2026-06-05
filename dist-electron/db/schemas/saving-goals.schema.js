"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savingGoals = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const accounts_schema_1 = require("./accounts.schema");
exports.savingGoals = (0, sqlite_core_1.sqliteTable)('saving_goals', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull(), // Ex: "Trocar de Carro", "Reserva de Emergência"
    description: (0, sqlite_core_1.text)('description'),
    targetAmount: (0, sqlite_core_1.real)('target_amount').notNull(), // Quanto ele quer juntar (Ex: 10000.00)
    currentAmount: (0, sqlite_core_1.real)('current_amount').default(0.0).notNull(), // Quanto já tem poupado (Ex: 2500.00)
    targetDate: (0, sqlite_core_1.text)('target_date'), // Data limite no formato YYYY-MM-DD (Opcional)
    // Opcional: Vincula a meta a uma conta/caixinha específica de investimento ou poupança
    accountId: (0, sqlite_core_1.text)('account_id').references(() => accounts_schema_1.accounts.id, { onDelete: 'set null' }),
    status: (0, sqlite_core_1.text)('status', { enum: ['active', 'completed', 'paused'] }).default('active').notNull(),
    icon: (0, sqlite_core_1.text)('icon').default('savings'), // Ícone para renderizar na UI (Ex: 'home', 'flight')
    color: (0, sqlite_core_1.text)('color'), // Cor customizada para a barra de progresso da meta
    createdAt: (0, sqlite_core_1.text)('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    // Índice para acelerar a listagem de metas ativas na tela do usuário
    statusIdx: (0, sqlite_core_1.index)('idx_saving_goals_status').on(table.status),
}));
