export type InvestmentPortfolioStrategy =
  | 'income'
  | 'growth'
  | 'balanced'
  | 'capital_preservation'
  | 'custom';

export type InvestmentRiskProfile = 'conservative' | 'moderate' | 'aggressive';

export type InvestmentPortfolioAssetType =
  | 'stock'
  | 'fii'
  | 'etf'
  | 'bdr'
  | 'reit'
  | 'international_stock'
  | 'cdb'
  | 'lci_lca'
  | 'treasury'
  | 'crypto'
  | 'fund'
  | 'other';

export type FixedIncomeIndexer = 'cdi' | 'selic' | 'ipca' | 'prefixed' | 'igpm' | 'other';
export type FixedIncomeRateType = 'percent_indexer' | 'indexer_plus' | 'annual';
export type FixedIncomeLiquidity = 'daily' | 'maturity' | 'custom';

export interface InvestmentPortfolio {
  id: string;
  name: string;
  strategy: InvestmentPortfolioStrategy;
  riskProfile: InvestmentRiskProfile;
  benchmark: string | null;
  currency: string;
  beginnerMode: boolean;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewInvestmentPortfolio {
  id?: string;
  name: string;
  strategy?: InvestmentPortfolioStrategy;
  riskProfile?: InvestmentRiskProfile;
  benchmark?: string | null;
  currency?: string;
  beginnerMode?: boolean;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InvestmentPortfolioAsset {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  type: InvestmentPortfolioAssetType;
  broker: string | null;
  sector: string | null;
  currency: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  purchaseDate: string | null;
  targetAllocation: number;
  dividendYield: number;
  annualIncome: number;
  fixedIncomeIndexer: FixedIncomeIndexer | null;
  fixedIncomeRateType: FixedIncomeRateType | null;
  fixedIncomeRate: number | null;
  fixedIncomeMaturityDate: string | null;
  fixedIncomeLiquidity: FixedIncomeLiquidity | null;
  fixedIncomeInvestedAmount: number | null;
  fixedIncomeGrossAmount: number | null;
  fixedIncomeNetAmount: number | null;
  fixedIncomeTaxExempt: boolean | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewInvestmentPortfolioAsset {
  id?: string;
  portfolioId: string;
  ticker: string;
  name: string;
  type: InvestmentPortfolioAssetType;
  broker?: string | null;
  sector?: string | null;
  currency?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  purchaseDate?: string | null;
  targetAllocation?: number;
  dividendYield?: number;
  annualIncome?: number;
  fixedIncomeIndexer?: FixedIncomeIndexer | null;
  fixedIncomeRateType?: FixedIncomeRateType | null;
  fixedIncomeRate?: number | null;
  fixedIncomeMaturityDate?: string | null;
  fixedIncomeLiquidity?: FixedIncomeLiquidity | null;
  fixedIncomeInvestedAmount?: number | null;
  fixedIncomeGrossAmount?: number | null;
  fixedIncomeNetAmount?: number | null;
  fixedIncomeTaxExempt?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InvestmentAssetSnapshot {
  id: string;
  assetId: string;
  portfolioId: string;
  snapshotDate: string;
  investedAmount: number;
  grossAmount: number;
  netAmount: number;
  resultAmount: number;
  quantity: number;
  currentPrice: number;
  notes: string | null;
  createdAt: string | null;
}

export interface NewInvestmentAssetSnapshot {
  id?: string;
  assetId: string;
  portfolioId: string;
  snapshotDate: string;
  investedAmount: number;
  grossAmount: number;
  netAmount: number;
  resultAmount: number;
  quantity?: number;
  currentPrice?: number;
  notes?: string | null;
  createdAt?: string | null;
}
