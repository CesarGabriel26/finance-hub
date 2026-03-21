import sqlite3 from 'sqlite3';
import path from 'path';
import { app } from 'electron';

const appPath = app.isPackaged
    ? path.join(path.dirname(app.getPath('exe')), 'finance-hub.db')
    : path.join(app.getAppPath(), 'finance-hub.db');

export const db = new sqlite3.Database(appPath, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        db.serialize(() => {
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

            db.run(`CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                due_date DATE NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('C', 'D')),
                category_id INTEGER,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
                is_recurring BOOLEAN DEFAULT 0,
                total_installments INTEGER DEFAULT 1,
                current_installment INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                objective_value REAL,
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

            // Optional: Migrate keywords to keyword_rules if empty
            db.get("SELECT COUNT(*) as count FROM keyword_rules", (err, row) => {
                if (row && row.count === 0) {
                    db.run("INSERT INTO keyword_rules (keyword, category_id) SELECT keyword, category_id FROM keywords");
                }
            });
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
