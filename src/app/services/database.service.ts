import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

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
  current_value?: number;
  benchmark?: string;
  index_type?: 'CDI' | 'SELIC' | 'IPCA' | 'FIXO' | null;
  index_percentage?: number | null;
  status?: string;
  created_at?: string;
  is_estimated?: boolean;
  initial_balance?: number;
}

export interface AssetHistory {
  id?: number;
  asset_id: number;
  date: string;
  value: number;
  type: 'saldo' | 'aporte';
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
      updateAccountName: (id: number, name: string) => Promise<any>;

      getCategories: () => Promise<Category[]>;
      addCategory: (category: Partial<Category>) => Promise<any>;
      deleteCategory: (id: number) => Promise<any>;

      getMovements: (accountId: number, period: string) => Promise<Movement[]>;
      getMovementsForReview: () => Promise<Movement[]>;
      addMovement: (movement: Partial<Movement>, skipRecalculation?: boolean) => Promise<any>;
      updateMovement: (id: number, movement: Partial<Movement>, skipRecalculation?: boolean) => Promise<any>;
      deleteMovement: (id: number, skipRecalculation?: boolean) => Promise<any>;
      closePeriod: (accountId: number, period: string) => Promise<any>;
      recalculateBalance: (accountId: number) => Promise<any>;

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
      updateAsset: (id: number, asset: Partial<Asset>) => Promise<any>;
      deleteAsset: (id: number) => Promise<any>;
      getInvestmentEntries: (assetId: number) => Promise<InvestmentEntry[]>;
      getAllInvestmentEntries: () => Promise<InvestmentEntry[]>;
      addInvestmentEntry: (entry: Partial<InvestmentEntry>) => Promise<any>;
      deleteInvestmentEntry: (id: number) => Promise<any>;
      getMonthlyStats: (months?: number) => Promise<any[]>;

      // Dashboard
      getDashboardData: (period: string, filters?: any) => Promise<any[]>;
      getDashboardEvolution: (periods: string[], filters?: any) => Promise<any[]>;
      getRecentMovements: (limit?: number, filters?: any) => Promise<Movement[]>;
      
      recategorizeMovements: () => Promise<{ updatedCount: number }>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  toastService = inject(ToastService);

  constructor() { }

  private async handleApi<T>(apiPromise: Promise<T>): Promise<T> {
    try {
      return await apiPromise;
    } catch (err: any) {
      console.error(err);
      this.toastService.error(err.message || 'Erro ao comunicar com o servidor');
      throw err;
    }
  }

  async getDashboardData(period: string, filters?: any): Promise<any[]> {
    return this.handleApi(window.api.getDashboardData(period, filters));
  }

  async getDashboardEvolution(periods: string[], filters?: any): Promise<any[]> {
    return this.handleApi(window.api.getDashboardEvolution(periods, filters));
  }

  async getRecentMovements(limit: number = 5, filters?: any): Promise<Movement[]> {
    return this.handleApi(window.api.getRecentMovements(limit, filters));
  }

  async getAccounts(): Promise<Account[]> {
    return this.handleApi(window.api.getAccounts());
  }

  async addAccount(account: Partial<Account>): Promise<any> {
    return this.handleApi(window.api.addAccount(account));
  }

  async deleteAccount(id: number): Promise<any> {
      return this.handleApi(window.api.deleteAccount(id));
  }
  
  async updateAccountBalance(id: number, balance: number): Promise<any> {
      return this.handleApi(window.api.updateAccountBalance(id, balance));
  }

  async getCategories(): Promise<Category[]> {
    return this.handleApi(window.api.getCategories());
  }
  
  async addCategory(category: Partial<Category>): Promise<any> {
    return this.handleApi(window.api.addCategory(category));
  }

  async deleteCategory(id: number): Promise<any> {
    return this.handleApi(window.api.deleteCategory(id));
  }

  async getMovements(accountId: number, period: string): Promise<Movement[]> {
    return this.handleApi(window.api.getMovements(accountId, period));
  }

  async getMovementsForReview(): Promise<Movement[]> {
    return this.handleApi(window.api.getMovementsForReview());
  }

  async addMovement(movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    return this.handleApi(window.api.addMovement(movement, skipRecalculation));
  }

  async updateMovement(id: number, movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    return this.handleApi(window.api.updateMovement(id, movement, skipRecalculation));
  }

  async deleteMovement(id: number, skipRecalculation?: boolean): Promise<any> {
    return this.handleApi(window.api.deleteMovement(id, skipRecalculation));
  }

  async closePeriod(accountId: number, period: string): Promise<any> {
    return this.handleApi(window.api.closePeriod(accountId, period));
  }

  async recalculateBalance(accountId: number): Promise<any> {
    return this.handleApi(window.api.recalculateBalance(accountId));
  }

  // Keywords
  async getKeywords(): Promise<Keyword[]> {
    return this.handleApi(window.api.getKeywords());
  }

  async addKeyword(keyword: string, categoryId: number): Promise<any> {
    return this.handleApi(window.api.addKeyword(keyword, categoryId));
  }

  async deleteKeyword(id: number): Promise<any> {
    return this.handleApi(window.api.deleteKeyword(id));
  }

  // Keyword Rules
  async getKeywordRules(): Promise<KeywordRule[]> {
    return this.handleApi(window.api.getKeywordRules());
  }

  async addKeywordRule(rule: Partial<KeywordRule>): Promise<any> {
    return this.handleApi(window.api.addKeywordRule(rule));
  }

  async deleteKeywordRule(id: number): Promise<any> {
    return this.handleApi(window.api.deleteKeywordRule(id));
  }

  // Bills
  async getBills(type?: 'C' | 'D', status?: 'pending' | 'paid'): Promise<Bill[]> {
    return this.handleApi(window.api.getBills(type, status));
  }

  async addBill(bill: Partial<Bill>): Promise<any> {
    return this.handleApi(window.api.addBill(bill));
  }

  async deleteBill(id: number): Promise<any> {
    return this.handleApi(window.api.deleteBill(id));
  }

  async payBill(data: { billId: number, accountId: number, paymentDate: string }): Promise<any> {
    return this.handleApi(window.api.payBill(data));
  }

  // Investments
  async getAssets(): Promise<Asset[]> {
    return this.handleApi(window.api.getAssets());
  }

  async addAsset(asset: Partial<Asset>): Promise<any> {
    return this.handleApi(window.api.addAsset(asset));
  }

  async updateAsset(id: number, asset: Partial<Asset>): Promise<any> {
    return this.handleApi(window.api.updateAsset(id, asset));
  }

  async deleteAsset(id: number): Promise<any> {
    return this.handleApi(window.api.deleteAsset(id));
  }

  async getInvestmentEntries(assetId: number): Promise<InvestmentEntry[]> {
    return this.handleApi(window.api.getInvestmentEntries(assetId));
  }

  async getAllInvestmentEntries(): Promise<InvestmentEntry[]> {
    return this.handleApi(window.api.getAllInvestmentEntries());
  }

  async addInvestmentEntry(entry: Partial<InvestmentEntry>): Promise<any> {
    return this.handleApi(window.api.addInvestmentEntry(entry));
  }

  async deleteInvestmentEntry(id: number): Promise<any> {
    return this.handleApi(window.api.deleteInvestmentEntry(id));
  }

  async getMonthlyStats(months: number = 12): Promise<any[]> {
    return this.handleApi(window.api.getMonthlyStats(months));
  }

  async updateAccountName(id: number, name: string): Promise<any> {
    return this.handleApi(window.api.updateAccountName(id, name));
  }

  async recategorizeMovements(): Promise<{ updatedCount: number }> {
    return this.handleApi(window.api.recategorizeMovements());
  }

}
