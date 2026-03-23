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
