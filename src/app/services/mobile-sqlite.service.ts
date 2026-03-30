import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class MobileSqliteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private initPromise: Promise<void>;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initPromise = this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Create connection
      this.db = await this.sqlite.createConnection('finance-hub', false, 'no-encryption', 1, false);
      await this.db.open();

      // Initialization logic from electron/src/services/database.services.js
      await this.db.execute(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, balance REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('C', 'D')), is_fixed BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS movements (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, category_id INTEGER, description TEXT NOT NULL, amount REAL NOT NULL, period TEXT NOT NULL, date DATETIME NOT NULL, type TEXT NOT NULL CHECK(type IN ('AC', 'FC', 'C', 'D')), order_index INTEGER NOT NULL DEFAULT 2, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (account_id) REFERENCES accounts(id), FOREIGN KEY (category_id) REFERENCES categories(id));
        CREATE TABLE IF NOT EXISTS keywords (id INTEGER PRIMARY KEY AUTOINCREMENT, keyword TEXT NOT NULL, category_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id));
        CREATE TABLE IF NOT EXISTS keyword_rules (id INTEGER PRIMARY KEY AUTOINCREMENT, keyword TEXT NOT NULL, category_id INTEGER NOT NULL, priority INTEGER DEFAULT 0, created_by_user BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id));
        CREATE TABLE IF NOT EXISTS bills (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, amount REAL NOT NULL, due_date DATE NOT NULL, type TEXT NOT NULL CHECK(type IN ('C', 'D')), category_id INTEGER, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')), is_recurring BOOLEAN DEFAULT 0, recurrence_classification TEXT CHECK(recurrence_classification IN ('fixed', 'variable')), total_installments INTEGER DEFAULT 1, current_installment INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id));
        CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT, objective_value REAL, index_type TEXT, index_percentage REAL, current_value REAL DEFAULT 0, benchmark TEXT, status TEXT DEFAULT 'active', initial_balance REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS investment_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER NOT NULL, asset_id INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal')), amount REAL NOT NULL, date DATETIME NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (account_id) REFERENCES accounts(id), FOREIGN KEY (asset_id) REFERENCES assets(id));
        CREATE TABLE IF NOT EXISTS asset_history (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL, date DATE NOT NULL, value REAL NOT NULL, type TEXT NOT NULL CHECK(type IN ('saldo', 'aporte')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (asset_id) REFERENCES assets(id));
        CREATE TABLE IF NOT EXISTS market_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, date DATE NOT NULL UNIQUE, cdi REAL, selic REAL, ipca REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL, monthly_limit REAL NOT NULL, month INTEGER NOT NULL, year INTEGER NOT NULL, alert_threshold_percentage REAL DEFAULT 80, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories(id), UNIQUE(category_id, month, year));
        CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      `);
      console.log('Mobile SQLite Database initialized completely.');
    } catch (err) {
      console.error('Error initializing SQLite DB:', err);
    }
  }

  async run(query: string, params: any[] = []): Promise<any> {
    await this.initPromise;
    const res = await this.db.run(query, params);
    return { id: res.changes?.lastId, changes: res.changes?.changes };
  }

  async get(query: string, params: any[] = []): Promise<any> {
    await this.initPromise;
    const res = await this.db.query(query, params);
    return res.values && res.values.length > 0 ? res.values[0] : null;
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    await this.initPromise;
    const res = await this.db.query(query, params);
    return res.values || [];
  }
}

// Helper functions that mimic the electron methods so ported files compile directly
let mobileSqliteServiceInstance: MobileSqliteService | null = null;

export function setMobileSqliteService(instance: MobileSqliteService) {
  mobileSqliteServiceInstance = instance;
}

export async function dbRun(query: string, params: any[] = []) {
  if (!mobileSqliteServiceInstance) throw new Error("MobileSqliteService not initialized");
  return mobileSqliteServiceInstance.run(query, params);
}

export async function dbGet(query: string, params: any[] = []) {
  if (!mobileSqliteServiceInstance) throw new Error("MobileSqliteService not initialized");
  return mobileSqliteServiceInstance.get(query, params);
}

export async function dbAll(query: string, params: any[] = []) {
  if (!mobileSqliteServiceInstance) throw new Error("MobileSqliteService not initialized");
  return mobileSqliteServiceInstance.all(query, params);
}
