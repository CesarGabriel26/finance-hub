"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.runMigrations = runMigrations;
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const schema = __importStar(require("./schemas"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
// Caminho do banco dentro do diretório do app (AppData em prod, raiz do projeto em dev)
const dbBasePath = electron_1.app.isPackaged ? electron_1.app.getPath('userData') : electron_1.app.getAppPath();
const dbPath = path_1.default.join(dbBasePath, 'financehub.db');
console.log(`[DB] Arquivo SQLite: ${dbPath}`);
const sqlite = new better_sqlite3_2.default(dbPath);
// Força chaves estrangeiras (desligadas por padrão no SQLite)
sqlite.pragma('foreign_keys = ON');
// WAL melhora performance em leituras/escritas concorrentes
sqlite.pragma('journal_mode = WAL');
exports.db = (0, better_sqlite3_1.drizzle)(sqlite, { schema });
/**
 * Insere categorias padrão se a tabela de categorias estiver vazia.
 */
function seedDefaultCategories() {
    try {
        const existing = exports.db.select().from(schema.categories).all();
        if (existing.length > 0) {
            console.log('[DB] Categorias já existem no banco. Pulando seeding.');
            return;
        }
        console.log('[DB] Inciando seeding de categorias padrão...');
        const defaultCategories = [
            // ── Despesas do dia a dia (expense) ──────────────────────────────────
            { name: 'Alimentação', type: 'expense', icon: 'restaurant', color: '#f97316' },
            { name: 'Transporte', type: 'expense', icon: 'directions_car', color: '#3b82f6' },
            { name: 'Moradia', type: 'expense', icon: 'home', color: '#6366f1' },
            { name: 'Lazer & Entretenimento', type: 'expense', icon: 'sports_esports', color: '#ec4899' },
            { name: 'Saúde', type: 'expense', icon: 'medical_services', color: '#ef4444' },
            { name: 'Educação', type: 'expense', icon: 'school', color: '#a855f7' },
            { name: 'Compras & Vestuário', type: 'expense', icon: 'shopping_bag', color: '#14b8a6' },
            { name: 'Impostos & Taxas', type: 'expense', icon: 'receipt_long', color: '#64748b' },
            { name: 'Seguros', type: 'expense', icon: 'shield', color: '#0ea5e9' },
            { name: 'Outras Despesas', type: 'expense', icon: 'payments', color: '#94a3b8' },
            // ── Despesas de Investimentos (expense) ───────────────────────────────
            { name: 'Investimentos - Aportes', type: 'expense', icon: 'savings', color: '#10b981' },
            { name: 'Investimentos - Taxas/Corretagem', type: 'expense', icon: 'account_balance_wallet', color: '#06b6d4' },
            // ── Receitas do dia a dia (income) ───────────────────────────────────
            { name: 'Salário & Pró-labore', type: 'income', icon: 'work', color: '#10b981' },
            { name: 'Prestação de Serviços', type: 'income', icon: 'handshake', color: '#06b6d4' },
            { name: 'Reembolsos', type: 'income', icon: 'price_check', color: '#0ea5e9' },
            { name: 'Outras Receitas', type: 'income', icon: 'add_card', color: '#f59e0b' },
            // ── Receitas de Investimentos (income) ────────────────────────────────
            { name: 'Investimentos - Dividendos & JCP', type: 'income', icon: 'payments', color: '#84cc16' },
            { name: 'Investimentos - Rendimentos RF', type: 'income', icon: 'trending_up', color: '#22c55e' },
            { name: 'Investimentos - Venda de Ativos', type: 'income', icon: 'sell', color: '#15803d' },
        ];
        exports.db.insert(schema.categories).values(defaultCategories).run();
        console.log('[DB] Seeding de categorias padrão concluído com sucesso.');
    }
    catch (error) {
        console.error('[DB] Falha no seeding de categorias padrão:', error);
    }
}
function resolveMigrationsFolder() {
    const resourcesPath = process.resourcesPath;
    const candidates = [
        path_1.default.join(electron_1.app.getAppPath(), 'electron', 'db', 'migrations'),
        path_1.default.join(electron_1.app.getAppPath(), 'dist-electron', 'db', 'migrations'),
        ...(resourcesPath ? [path_1.default.join(resourcesPath, 'electron', 'db', 'migrations')] : []),
    ];
    const migrationsFolder = candidates.find(candidate => fs_1.default.existsSync(path_1.default.join(candidate, 'meta', '_journal.json')));
    if (!migrationsFolder) {
        throw new Error(`[DB] Pasta de migrations nao encontrada. Caminhos testados: ${candidates.join(', ')}`);
    }
    return migrationsFolder;
}
/**
 * Executa todas as migrations pendentes de forma síncrona.
 * Deve ser chamado uma vez no boot do processo main, antes de `initFinancialApi()`.
 */
function runMigrations() {
    const migrationsFolder = resolveMigrationsFolder();
    try {
        console.log(`[DB] Pasta de migrations: ${migrationsFolder}`);
        (0, migrator_1.migrate)(exports.db, { migrationsFolder });
        console.log('[DB] Migrations aplicadas com sucesso.');
        // Roda o seed de categorias após garantir a existência das tabelas
        seedDefaultCategories();
    }
    catch (error) {
        console.error('[DB] Falha ao aplicar migrations:', error);
        throw error; // Aborta o boot se o banco não puder ser inicializado
    }
}
