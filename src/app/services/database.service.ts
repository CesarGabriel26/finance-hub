import { Injectable } from '@angular/core';

export interface Account {
  id?: number;
  name: string;
  balance?: number;
  created_at?: string;
}



export interface Category {
  id?: number;
  name: string;
  type: 'C' | 'D';
  created_at?: string;
}

export interface Keyword {
  id?: number;
  keyword: string;
  category_id: number;
  category_name?: string;
  category_type?: 'C' | 'D';
  created_at?: string;
}

export interface KeywordRule {
  id?: number;
  keyword: string;
  category_id: number;
  category_name?: string;
  priority: number;
  created_by_user: boolean;
  created_at?: string;
}

export interface Movement {
  id?: number;
  account_id: number;
  category_id?: number | null;
  description: string;
  amount: number;
  period: string;
  date: string;
  type: 'AC' | 'FC' | 'C' | 'D';
  order_index?: number;
  classification_source?: 'manual' | 'keyword' | 'imported';
  classification_rule_id?: number | null;
  confidence?: number | null;
  category_name?: string;
  account_name?: string;
  created_at?: string;
}

export interface Bill {
  id?: number;
  description: string;
  amount: number;
  due_date: string;
  type: 'C' | 'D';
  category_id?: number | null;
  category_name?: string;
  status: 'pending' | 'paid';
  is_recurring: boolean;
  total_installments: number;
  current_installment: number;
  created_at?: string;
}

export interface Asset {
  id?: number;
  name: string;
  type?: string;
  objective_value?: number;
  total_invested?: number;
  created_at?: string;
}

export interface InvestmentEntry {
  id?: number;
  account_id: number;
  asset_id: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  description?: string;
  account_name?: string;
  created_at?: string;
}

declare global {
  interface Window {
    api: {
      getAccounts: () => Promise<Account[]>;
      addAccount: (account: Partial<Account>) => Promise<any>;
      deleteAccount: (id: number) => Promise<any>;
      updateAccountBalance: (id: number, balance: number) => Promise<any>;

      getCategories: () => Promise<Category[]>;
      addCategory: (category: Partial<Category>) => Promise<any>;
      deleteCategory: (id: number) => Promise<any>;

      getMovements: (accountId: number, period: string) => Promise<Movement[]>;
      getMovementsForReview: () => Promise<Movement[]>;
      addMovement: (movement: Partial<Movement>) => Promise<any>;
      updateMovement: (id: number, movement: Partial<Movement>) => Promise<any>;
      deleteMovement: (id: number) => Promise<any>;
      closePeriod: (accountId: number, period: string) => Promise<any>;

      // Keywords
      getKeywords: () => Promise<Keyword[]>;
      addKeyword: (keyword: string, categoryId: number) => Promise<any>;
      deleteKeyword: (id: number) => Promise<any>;

      // Keyword Rules
      getKeywordRules: () => Promise<KeywordRule[]>;
      addKeywordRule: (rule: Partial<KeywordRule>) => Promise<any>;
      deleteKeywordRule: (id: number) => Promise<any>;

      // Bills
      getBills: (type?: 'C' | 'D', status?: 'pending' | 'paid') => Promise<Bill[]>;
      addBill: (bill: Partial<Bill>) => Promise<any>;
      deleteBill: (id: number) => Promise<any>;
      payBill: (data: { billId: number, accountId: number, paymentDate: string }) => Promise<any>;

      // Investments
      getAssets: () => Promise<Asset[]>;
      addAsset: (asset: Partial<Asset>) => Promise<any>;
      deleteAsset: (id: number) => Promise<any>;
      getInvestmentEntries: (assetId: number) => Promise<InvestmentEntry[]>;
      addInvestmentEntry: (entry: Partial<InvestmentEntry>) => Promise<any>;
      deleteInvestmentEntry: (id: number) => Promise<any>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor() { }

  async getAccounts(): Promise<Account[]> {
    return window.api.getAccounts();
  }

  async addAccount(account: Partial<Account>): Promise<any> {
    return window.api.addAccount(account);
  }

  async deleteAccount(id: number): Promise<any> {
      return window.api.deleteAccount(id);
  }
  
  async updateAccountBalance(id: number, balance: number): Promise<any> {
      return window.api.updateAccountBalance(id, balance);
  }

  async getCategories(): Promise<Category[]> {
    return window.api.getCategories();
  }
  
  async addCategory(category: Partial<Category>): Promise<any> {
    return window.api.addCategory(category);
  }

  async deleteCategory(id: number): Promise<any> {
    return window.api.deleteCategory(id);
  }

  async getMovements(accountId: number, period: string): Promise<Movement[]> {
    return window.api.getMovements(accountId, period);
  }

  async getMovementsForReview(): Promise<Movement[]> {
    return window.api.getMovementsForReview();
  }

  async addMovement(movement: Partial<Movement>): Promise<any> {
    return window.api.addMovement(movement);
  }

  async updateMovement(id: number, movement: Partial<Movement>): Promise<any> {
    return window.api.updateMovement(id, movement);
  }

  async deleteMovement(id: number): Promise<any> {
    return window.api.deleteMovement(id);
  }

  async closePeriod(accountId: number, period: string): Promise<any> {
    return window.api.closePeriod(accountId, period);
  }

  // Keywords
  async getKeywords(): Promise<Keyword[]> {
    return window.api.getKeywords();
  }

  async addKeyword(keyword: string, categoryId: number): Promise<any> {
    return window.api.addKeyword(keyword, categoryId);
  }

  async deleteKeyword(id: number): Promise<any> {
    return window.api.deleteKeyword(id);
  }

  // Keyword Rules
  async getKeywordRules(): Promise<KeywordRule[]> {
    return window.api.getKeywordRules();
  }

  async addKeywordRule(rule: Partial<KeywordRule>): Promise<any> {
    return window.api.addKeywordRule(rule);
  }

  async deleteKeywordRule(id: number): Promise<any> {
    return window.api.deleteKeywordRule(id);
  }

  // Bills
  async getBills(type?: 'C' | 'D', status?: 'pending' | 'paid'): Promise<Bill[]> {
    return window.api.getBills(type, status);
  }

  async addBill(bill: Partial<Bill>): Promise<any> {
    return window.api.addBill(bill);
  }

  async deleteBill(id: number): Promise<any> {
    return window.api.deleteBill(id);
  }

  async payBill(data: { billId: number, accountId: number, paymentDate: string }): Promise<any> {
    return window.api.payBill(data);
  }

  // Investments
  async getAssets(): Promise<Asset[]> {
    return window.api.getAssets();
  }

  async addAsset(asset: Partial<Asset>): Promise<any> {
    return window.api.addAsset(asset);
  }

  async deleteAsset(id: number): Promise<any> {
    return window.api.deleteAsset(id);
  }

  async getInvestmentEntries(assetId: number): Promise<InvestmentEntry[]> {
    return window.api.getInvestmentEntries(assetId);
  }

  async addInvestmentEntry(entry: Partial<InvestmentEntry>): Promise<any> {
    return window.api.addInvestmentEntry(entry);
  }

  async deleteInvestmentEntry(id: number): Promise<any> {
    return window.api.deleteInvestmentEntry(id);
  }

}
