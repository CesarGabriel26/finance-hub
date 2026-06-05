import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schemas';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// Caminho do banco dentro do diretório do app (AppData em prod, raiz do projeto em dev)
const dbBasePath = app.isPackaged ? app.getPath('userData') : app.getAppPath();
const dbPath = path.join(dbBasePath, 'financehub.db');

console.log(`[DB] Arquivo SQLite: ${dbPath}`);

const sqlite = new Database(dbPath);

// Força chaves estrangeiras (desligadas por padrão no SQLite)
sqlite.pragma('foreign_keys = ON');
// WAL melhora performance em leituras/escritas concorrentes
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

/**
 * Insere categorias padrão se a tabela de categorias estiver vazia.
 */
function seedDefaultCategories(): void {
  try {
    const existing = db.select().from(schema.categories).all();
    if (existing.length > 0) {
      console.log('[DB] Categorias já existem no banco. Pulando seeding.');
      return;
    }

    console.log('[DB] Inciando seeding de categorias padrão...');
    const defaultCategories = [
      // ── Despesas do dia a dia (expense) ──────────────────────────────────
      { name: 'Alimentação', type: 'expense' as const, icon: 'restaurant', color: '#f97316' },
      { name: 'Transporte', type: 'expense' as const, icon: 'directions_car', color: '#3b82f6' },
      { name: 'Moradia', type: 'expense' as const, icon: 'home', color: '#6366f1' },
      { name: 'Lazer & Entretenimento', type: 'expense' as const, icon: 'sports_esports', color: '#ec4899' },
      { name: 'Saúde', type: 'expense' as const, icon: 'medical_services', color: '#ef4444' },
      { name: 'Educação', type: 'expense' as const, icon: 'school', color: '#a855f7' },
      { name: 'Compras & Vestuário', type: 'expense' as const, icon: 'shopping_bag', color: '#14b8a6' },
      { name: 'Impostos & Taxas', type: 'expense' as const, icon: 'receipt_long', color: '#64748b' },
      { name: 'Seguros', type: 'expense' as const, icon: 'shield', color: '#0ea5e9' },
      { name: 'Outras Despesas', type: 'expense' as const, icon: 'payments', color: '#94a3b8' },

      // ── Despesas de Investimentos (expense) ───────────────────────────────
      { name: 'Investimentos - Aportes', type: 'expense' as const, icon: 'savings', color: '#10b981' },
      { name: 'Investimentos - Taxas/Corretagem', type: 'expense' as const, icon: 'account_balance_wallet', color: '#06b6d4' },

      // ── Receitas do dia a dia (income) ───────────────────────────────────
      { name: 'Salário & Pró-labore', type: 'income' as const, icon: 'work', color: '#10b981' },
      { name: 'Prestação de Serviços', type: 'income' as const, icon: 'handshake', color: '#06b6d4' },
      { name: 'Reembolsos', type: 'income' as const, icon: 'price_check', color: '#0ea5e9' },
      { name: 'Outras Receitas', type: 'income' as const, icon: 'add_card', color: '#f59e0b' },

      // ── Receitas de Investimentos (income) ────────────────────────────────
      { name: 'Investimentos - Dividendos & JCP', type: 'income' as const, icon: 'payments', color: '#84cc16' },
      { name: 'Investimentos - Rendimentos RF', type: 'income' as const, icon: 'trending_up', color: '#22c55e' },
      { name: 'Investimentos - Venda de Ativos', type: 'income' as const, icon: 'sell', color: '#15803d' },
    ];

    db.insert(schema.categories).values(defaultCategories).run();
    console.log('[DB] Seeding de categorias padrão concluído com sucesso.');
  } catch (error) {
    console.error('[DB] Falha no seeding de categorias padrão:', error);
  }
}

function resolveMigrationsFolder(): string {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    path.join(app.getAppPath(), 'electron', 'db', 'migrations'),
    path.join(app.getAppPath(), 'dist-electron', 'db', 'migrations'),
    ...(resourcesPath ? [path.join(resourcesPath, 'electron', 'db', 'migrations')] : []),
  ];

  const migrationsFolder = candidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'meta', '_journal.json'))
  );

  if (!migrationsFolder) {
    throw new Error(`[DB] Pasta de migrations nao encontrada. Caminhos testados: ${candidates.join(', ')}`);
  }

  return migrationsFolder;
}

/**
 * Executa todas as migrations pendentes de forma síncrona.
 * Deve ser chamado uma vez no boot do processo main, antes de `initFinancialApi()`.
 */
export function runMigrations(): void {
  const migrationsFolder = resolveMigrationsFolder();

  try {
    console.log(`[DB] Pasta de migrations: ${migrationsFolder}`);
    migrate(db, { migrationsFolder });
    console.log('[DB] Migrations aplicadas com sucesso.');
    
    // Roda o seed de categorias após garantir a existência das tabelas
    seedDefaultCategories();
  } catch (error) {
    console.error('[DB] Falha ao aplicar migrations:', error);
    throw error; // Aborta o boot se o banco não puder ser inicializado
  }
}
