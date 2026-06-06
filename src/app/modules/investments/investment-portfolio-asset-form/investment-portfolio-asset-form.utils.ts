import type {
  FixedIncomeIndexer,
  FixedIncomeLiquidity,
  FixedIncomeRateType,
  InvestmentPortfolioAssetType,
  NewInvestmentPortfolioAsset,
} from '../../../models';
import { isFixedIncomeType } from '../investment-calculations.util';

export interface InvestmentAssetFormValue {
  ticker: string;
  name: string;
  type: InvestmentPortfolioAssetType;
  broker: string;
  sector: string;
  currency: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  purchaseDate: string;
  targetAllocation: number;
  dividendYield: number;
  annualIncome: number;
  fixedIncomeIndexer: FixedIncomeIndexer;
  fixedIncomeRateType: FixedIncomeRateType;
  fixedIncomeRate: number;
  fixedIncomeMaturityDate: string;
  fixedIncomeLiquidity: FixedIncomeLiquidity;
  fixedIncomeInvestedAmount: number;
  fixedIncomeGrossAmount: number;
  fixedIncomeNetAmount: number;
  fixedIncomeTaxExempt: boolean;
  notes: string;
}

export function buildInvestmentAssetPayload(
  portfolioId: string,
  raw: InvestmentAssetFormValue,
): NewInvestmentPortfolioAsset {
  const isFixedIncome = isFixedIncomeType(raw.type);
  const fixedIncomeInvestedAmount = Number(raw.fixedIncomeInvestedAmount) || 0;
  const fixedIncomeGrossAmount = Number(raw.fixedIncomeGrossAmount) || 0;
  const informedFixedIncomeNetAmount = Number(raw.fixedIncomeNetAmount) || 0;
  const fixedIncomeGrossCurrentAmount = fixedIncomeGrossAmount
    || informedFixedIncomeNetAmount
    || fixedIncomeInvestedAmount;
  const estimatedFixedIncomeNetAmount = estimateFixedIncomeNetAmount({
    investedAmount: fixedIncomeInvestedAmount,
    grossAmount: fixedIncomeGrossCurrentAmount,
    purchaseDate: raw.purchaseDate,
    taxExempt: raw.fixedIncomeTaxExempt,
  });
  const fixedIncomeNetCurrentAmount = informedFixedIncomeNetAmount || estimatedFixedIncomeNetAmount;
  const investedAmount = isFixedIncome
    ? fixedIncomeInvestedAmount
    : Number(raw.quantity) * Number(raw.averagePrice);
  const currentAmount = isFixedIncome
    ? fixedIncomeNetCurrentAmount
    : Number(raw.quantity) * Number(raw.currentPrice);
  const grossResultAmount = isFixedIncome
    ? fixedIncomeGrossCurrentAmount - investedAmount
    : currentAmount - investedAmount;

  return {
    portfolioId,
    ticker: raw.ticker.trim().toUpperCase(),
    name: raw.name.trim(),
    type: raw.type,
    broker: raw.broker.trim() || null,
    sector: raw.sector.trim() || null,
    currency: raw.currency,
    quantity: isFixedIncome ? 1 : Number(raw.quantity),
    averagePrice: isFixedIncome ? fixedIncomeInvestedAmount : Number(raw.averagePrice),
    currentPrice: isFixedIncome ? fixedIncomeNetCurrentAmount : Number(raw.currentPrice),
    purchaseDate: raw.purchaseDate || null,
    targetAllocation: Number(raw.targetAllocation) || 0,
    dividendYield: Number(raw.dividendYield) || 0,
    annualIncome: isFixedIncome ? Math.max(0, grossResultAmount) : Number(raw.annualIncome) || 0,
    fixedIncomeIndexer: isFixedIncome ? raw.fixedIncomeIndexer : null,
    fixedIncomeRateType: isFixedIncome ? raw.fixedIncomeRateType : null,
    fixedIncomeRate: isFixedIncome ? Number(raw.fixedIncomeRate) || 0 : null,
    fixedIncomeMaturityDate: isFixedIncome ? raw.fixedIncomeMaturityDate || null : null,
    fixedIncomeLiquidity: isFixedIncome ? raw.fixedIncomeLiquidity : null,
    fixedIncomeInvestedAmount: isFixedIncome ? fixedIncomeInvestedAmount : null,
    fixedIncomeGrossAmount: isFixedIncome ? fixedIncomeGrossCurrentAmount : null,
    fixedIncomeNetAmount: isFixedIncome ? fixedIncomeNetCurrentAmount || null : null,
    fixedIncomeTaxExempt: isFixedIncome ? raw.fixedIncomeTaxExempt : null,
    notes: raw.notes.trim() || null,
  };
}

export function estimateFixedIncomeNetAmount(options: {
  investedAmount: number;
  grossAmount: number;
  purchaseDate: string;
  taxExempt: boolean;
}): number {
  const profit = Math.max(0, options.grossAmount - options.investedAmount);
  if (profit <= 0 || options.taxExempt) return options.grossAmount;

  const days = holdingDays(options.purchaseDate);
  const iof = profit * iofRate(days);
  const taxableProfit = Math.max(0, profit - iof);
  const ir = taxableProfit * incomeTaxRate(days);

  return options.grossAmount - iof - ir;
}

function holdingDays(purchaseDate: string): number {
  if (!purchaseDate) return 721;

  const start = new Date(`${purchaseDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 721;

  const today = new Date();
  const diff = today.getTime() - start.getTime();

  return Math.max(0, Math.floor(diff / 86400000));
}

function incomeTaxRate(days: number): number {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

function iofRate(days: number): number {
  const rates = [
    0, 0.96, 0.93, 0.9, 0.86, 0.83, 0.8, 0.76, 0.73, 0.7,
    0.66, 0.63, 0.6, 0.56, 0.53, 0.5, 0.46, 0.43, 0.4, 0.36,
    0.33, 0.3, 0.26, 0.23, 0.2, 0.16, 0.13, 0.1, 0.06, 0.03, 0,
  ];

  return days >= 30 ? 0 : rates[Math.max(0, days)] ?? 0;
}
