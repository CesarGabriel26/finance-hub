import sqlite3_pkg from 'sqlite3';
const sqlite3 = sqlite3_pkg.verbose();
import path from 'path';
import electron from 'electron';
const { app } = electron;
import fs from 'fs';

const userDataPath = app.getPath('userData');
// Ensure consistent path regardless of productName spacing
const appDataPath = path.dirname(userDataPath);
const hypenatedPath = path.join(appDataPath, 'finance-hub');
const dataPath = path.join(userDataPath, 'data');

// Legacy check: If data exists in the hyphenated folder but we are in the spaced folder
// we should probably look there.
const legacyDbPath = path.join(hypenatedPath, 'finance-hub.db');
const currentDbPath = path.join(userDataPath, 'finance-hub.db'); // root of userData
const nestedDbPath = path.join(dataPath, 'finance-hub.db'); // inside /data

let dbPath;
if (app.isPackaged) {
    if (fs.existsSync(legacyDbPath)) {
        console.log(`[Database] Found legacy database at: ${legacyDbPath}`);
        dbPath = legacyDbPath;
    } else if (fs.existsSync(currentDbPath)) {
        console.log(`[Database] Using database from userData root: ${currentDbPath}`);
        dbPath = currentDbPath;
    } else {
        // Fallback to nested path or create it if needed
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        dbPath = nestedDbPath;
        console.log(`[Database] No existing database found, using default: ${dbPath}`);
    }
} else {
    dbPath = path.join(app.getAppPath(), 'finance-hub.db');
}

console.log(`Actual Database Path used: ${dbPath}`);

let resolveInit;
const initPromise = new Promise(res => resolveInit = res);

export const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
        console.error("FATAL ERROR: Could not open database file at " + dbPath);
        console.error("Error message: " + err.message);
    } else {
        console.log("Database opened successfully. Initializing...");
        try {
            // Use internal promises for initialization to ensure absolute order
            const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, (e) => e ? rej(e) : res()));
            const all = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
            const get = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r)));

            await run("PRAGMA foreign_keys = ON");

            await run(`CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                balance REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('C', 'D')),
                is_fixed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await run(`CREATE TABLE IF NOT EXISTS movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                category_id INTEGER,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                period TEXT NOT NULL,
                date DATETIME NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('AC', 'FC', 'C', 'D')),
                order_index INTEGER NOT NULL DEFAULT 2,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            await run(`CREATE TABLE IF NOT EXISTS keywords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            await run(`CREATE TABLE IF NOT EXISTS keyword_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                priority INTEGER DEFAULT 0,
                created_by_user BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            await run("CREATE TABLE IF NOT EXISTS bills (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, amount REAL NOT NULL, due_date DATE NOT NULL, type TEXT NOT NULL CHECK(type IN ('C', 'D')), category_id INTEGER, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')), is_recurring BOOLEAN DEFAULT 0, recurrence_classification TEXT CHECK(recurrence_classification IN ('fixed', 'variable')), total_installments INTEGER DEFAULT 1, current_installment INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id))");

            await run(`CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                objective_value REAL,
                index_type TEXT,
                index_percentage REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await run(`CREATE TABLE IF NOT EXISTS investment_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                asset_id INTEGER NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')),
                amount REAL NOT NULL,
                date DATETIME NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id),
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )`);

            await run(`CREATE TABLE IF NOT EXISTS asset_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                date DATE NOT NULL,
                value REAL NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('saldo', 'aporte')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )`);

            await run(`CREATE TABLE IF NOT EXISTS market_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                cdi REAL,
                selic REAL,
                ipca REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await run(`CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                monthly_limit REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                alert_threshold_percentage REAL DEFAULT 80,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                UNIQUE(category_id, month, year)
            )`);

            await run(`CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // --- ALL TABLES CREATED. NOW PERFORM MIGRATIONS ---

            const billsCols = await all("PRAGMA table_info(bills)");
            if (!billsCols.some(c => c.name === 'recurrence_classification')) {
                await run("ALTER TABLE bills ADD COLUMN recurrence_classification TEXT CHECK(recurrence_classification IN ('fixed', 'variable'))");
            }

            const moveCols = await all("PRAGMA table_info(movements)");
            if (!moveCols.some(c => c.name === 'classification_source')) {
                await run("ALTER TABLE movements ADD COLUMN classification_source TEXT CHECK(classification_source IN ('manual', 'keyword', 'imported'))");
                await run("ALTER TABLE movements ADD COLUMN classification_rule_id INTEGER");
                await run("ALTER TABLE movements ADD COLUMN confidence REAL");
            }

            const catCols = await all("PRAGMA table_info(categories)");
            if (!catCols.some(c => c.name === 'is_fixed')) {
                await run("ALTER TABLE categories ADD COLUMN is_fixed BOOLEAN DEFAULT 0");
            }

            const assetCols = await all("PRAGMA table_info(assets)");
            if (!assetCols.find(c => c.name === 'current_value')) await run("ALTER TABLE assets ADD COLUMN current_value REAL DEFAULT 0");
            if (!assetCols.find(c => c.name === 'benchmark')) await run("ALTER TABLE assets ADD COLUMN benchmark TEXT");
            if (!assetCols.find(c => c.name === 'status')) await run("ALTER TABLE assets ADD COLUMN status TEXT DEFAULT 'active'");
            if (!assetCols.find(c => c.name === 'initial_balance')) await run("ALTER TABLE assets ADD COLUMN initial_balance REAL DEFAULT 0");

            // --- INITIALIZE DEFAULT DATA ---

            const defaultSettings = [
                { key: 'open_at_login', value: 'false' },
                { key: 'notifications_enabled', value: 'true' },
                { key: 'minimized_to_tray', value: 'true' }
            ];

            for (const setting of defaultSettings) {
                await run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [setting.key, setting.value]);
            }

            const defaultCategories = [
                { name: 'Moradia', type: 'D', is_fixed: 1 },
                { name: 'Contas', type: 'D', is_fixed: 1 },
                { name: 'Assinaturas', type: 'D', is_fixed: 1 },
                { name: 'Saúde', type: 'D', is_fixed: 1 },
                { name: 'Educação', type: 'D', is_fixed: 1 },
                { name: 'Seguros', type: 'D', is_fixed: 1 },
                { name: 'Investimento (aplicação)', type: 'D', is_fixed: 1 },
                { name: 'Supermercado', type: 'D', is_fixed: 0 },
                { name: 'Transporte', type: 'D', is_fixed: 0 },
                { name: 'Alimentação', type: 'D', is_fixed: 0 },
                { name: 'Lazer', type: 'D', is_fixed: 0 },
                { name: 'Compras', type: 'D', is_fixed: 0 },
                { name: 'Impostos', type: 'D', is_fixed: 1 },
                { name: 'Financeiro', type: 'D', is_fixed: 0 },
                { name: 'Viagem', type: 'D', is_fixed: 0 },
                { name: 'Salário', type: 'C', is_fixed: 0 },
                { name: 'Freelance', type: 'C', is_fixed: 0 },
                { name: 'Investimentos', type: 'C', is_fixed: 0 },
                { name: 'Venda', type: 'C', is_fixed: 0 },
                { name: 'Transferência', type: 'C', is_fixed: 0 },
                { name: 'Reembolso', type: 'C', is_fixed: 0 }
            ];

            for (const cat of defaultCategories) {
                // First ensure standard categories have is_fixed set correctly BEFORE attempting insert or if they exist
                await run("UPDATE categories SET is_fixed = ? WHERE name = ? AND is_fixed = 0", [cat.is_fixed, cat.name]);
                await run("INSERT INTO categories (name, type, is_fixed) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ? AND type = ?)", [cat.name, cat.type, cat.is_fixed, cat.name, cat.type]);
            }

            const ruleCountRow = await get("SELECT COUNT(*) as count FROM keyword_rules");
            if (ruleCountRow && ruleCountRow.count === 0) {
                await run("INSERT INTO keyword_rules (keyword, category_id) SELECT keyword, category_id FROM keywords");
            }

            console.log("Database initialization and migrations complete.");
            resolveInit();
        } catch (error) {
            console.error("Error during database initialization:", error);
            resolveInit(); // Resolve anyway to unblock, or could handle differently
        }
    }
});

export const dbRun = async (query, params = []) => {
    await initPromise;
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

export const dbGet = async (query, params = []) => {
    await initPromise;
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

export const dbAll = async (query, params = []) => {
    await initPromise;
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * Safely closes the database connection.
 * @returns {Promise<void>}
 */
export const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                    reject(err);
                } else {
                    console.log('Database connection closed.');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

export { dbPath };
