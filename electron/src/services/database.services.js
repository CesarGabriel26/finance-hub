import sqlite3_pkg from 'sqlite3';
const sqlite3 = sqlite3_pkg.verbose();
import path from 'path';
import { app } from 'electron';
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

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("FATAL ERROR: Could not open database file at " + dbPath);
        console.error("Error message: " + err.message);
    } else {
        console.log("Database opened successfully.");
        db.serialize(() => {
            console.log("Initializing database tables...");
            db.run(`CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                balance REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('C', 'D')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS movements (
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

            db.run(`CREATE TABLE IF NOT EXISTS keywords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);







            db.run(`CREATE TABLE IF NOT EXISTS keyword_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                priority INTEGER DEFAULT 0,
                created_by_user BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            db.run("CREATE TABLE IF NOT EXISTS bills (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, amount REAL NOT NULL, due_date DATE NOT NULL, type TEXT NOT NULL CHECK(type IN ('C', 'D')), category_id INTEGER, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')), is_recurring BOOLEAN DEFAULT 0, recurrence_classification TEXT CHECK(recurrence_classification IN ('fixed', 'variable')), total_installments INTEGER DEFAULT 1, current_installment INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id))");

      // Column additions for existing tables
      db.all("PRAGMA table_info(bills)", (err, columns) => {
        if (err) return;
        const hasClassification = columns.some(c => c.name === 'recurrence_classification');
        if (!hasClassification) {
          db.run("ALTER TABLE bills ADD COLUMN recurrence_classification TEXT CHECK(recurrence_classification IN ('fixed', 'variable'))");
        }
      });

            db.run(`CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                objective_value REAL,
                index_type TEXT,
                index_percentage REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS investment_entries (
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



            db.all("PRAGMA table_info(movements)", (err, columns) => {
                if (columns) {
                    if (!columns.find(c => c.name === 'classification_source')) {
                        db.run("ALTER TABLE movements ADD COLUMN classification_source TEXT CHECK(classification_source IN ('manual', 'keyword', 'imported'))");
                        db.run("ALTER TABLE movements ADD COLUMN classification_rule_id INTEGER");
                        db.run("ALTER TABLE movements ADD COLUMN confidence REAL");
                    }
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS asset_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                date DATE NOT NULL,
                value REAL NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('saldo', 'aporte')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS market_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                cdi REAL,
                selic REAL,
                ipca REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.all("PRAGMA table_info(assets)", (err, columns) => {
                if (columns) {
                    if (!columns.find(c => c.name === 'current_value')) {
                        db.run("ALTER TABLE assets ADD COLUMN current_value REAL DEFAULT 0");
                    }
                    if (!columns.find(c => c.name === 'benchmark')) {
                        db.run("ALTER TABLE assets ADD COLUMN benchmark TEXT");
                    }
                    if (!columns.find(c => c.name === 'status')) {
                        db.run("ALTER TABLE assets ADD COLUMN status TEXT DEFAULT 'active'");
                    }
                    if (!columns.find(c => c.name === 'index_type')) {
                        db.run("ALTER TABLE assets ADD COLUMN index_type TEXT");
                    }
                    if (!columns.find(c => c.name === 'index_percentage')) {
                        db.run("ALTER TABLE assets ADD COLUMN index_percentage REAL");
                    }
                    if (!columns.find(c => c.name === 'initial_balance')) {
                        db.run("ALTER TABLE assets ADD COLUMN initial_balance REAL DEFAULT 0");
                    }
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS budgets (
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



            db.run(`CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Initialize default settings if they don't exist
            const defaultSettings = [
                { key: 'open_at_login', value: 'false' },
                { key: 'notifications_enabled', value: 'true' },
                { key: 'minimized_to_tray', value: 'true' }
            ];

            defaultSettings.forEach(setting => {
                db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [setting.key, setting.value]);
            });

            // Initialize default categories
            const defaultCategories = [
                { name: 'Moradia', type: 'D' },
                { name: 'Contas', type: 'D' },
                { name: 'Supermercado', type: 'D' },
                { name: 'Transporte', type: 'D' },
                { name: 'Alimentação', type: 'D' },
                { name: 'Lazer', type: 'D' },
                { name: 'Compras', type: 'D' },
                { name: 'Assinaturas', type: 'D' },
                { name: 'Saúde', type: 'D' },
                { name: 'Educação', type: 'D' },
                { name: 'Impostos', type: 'D' },
                { name: 'Financeiro', type: 'D' },
                { name: 'Viagem', type: 'D' },
                { name: 'Salário', type: 'C' },
                { name: 'Freelance', type: 'C' },
                { name: 'Investimentos', type: 'C' },
                { name: 'Venda', type: 'C' },
                { name: 'Transferência', type: 'C' },
                { name: 'Reembolso', type: 'C' }
            ];

            defaultCategories.forEach(cat => {
                db.run("INSERT INTO categories (name, type) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ? AND type = ?)", [cat.name, cat.type, cat.name, cat.type]);
            });

            // Optional: Migrate keywords to keyword_rules if empty
            db.get("SELECT COUNT(*) as count FROM keyword_rules", (err, row) => {
                if (row && row.count === 0) {
                    db.run("INSERT INTO keyword_rules (keyword, category_id) SELECT keyword, category_id FROM keywords");
                }
            });
            console.log("Database initialization blocks complete.");
        });
    }
});

export const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

export const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

export const dbAll = (query, params = []) => {
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
