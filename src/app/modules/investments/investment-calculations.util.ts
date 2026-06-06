import type {
  InvestmentAssetSnapshot,
  InvestmentPortfolio,
  InvestmentPortfolioAsset,
  InvestmentPortfolioAssetType,
} from '../../models';

export type AllocationBucketKey =
  | 'fixedIncome'
  | 'variableIncome'
  | 'realEstate'
  | 'international'
  | 'alternatives';

export interface AllocationBucket {
  key: AllocationBucketKey;
  label: string;
  current: number;
  target: number;
  color: string;
}

export interface AllocationProfile {
  key: string;
  label: string;
  description: string;
  riskProfile: InvestmentPortfolio['riskProfile'];
  strategy?: InvestmentPortfolio['strategy'];
  targets: Record<AllocationBucketKey, number>;
}

export interface InvestmentSnapshotEvolutionPoint {
  date: string;
  gross: number;
  net: number;
  result: number;
}

export const FIXED_INCOME_ASSET_TYPES = new Set<InvestmentPortfolioAssetType>([
  'cdb',
  'lci_lca',
  'treasury',
]);

export const RISK_PROFILES_LABELS: Record<InvestmentPortfolio['riskProfile'], string> = {
  conservative: 'Conservador',
  moderate: 'Moderado',
  aggressive: 'Agressivo',
};

export const STRATEGIES_LABELS: Record<InvestmentPortfolio['strategy'], string> = {
  capital_preservation: 'Preservacao de capital',
  income: 'Renda',
  global_diversification: 'Diversificacao global',
  growth: 'Crescimento',
  balanced: 'Balanceado',
  custom: 'Customizado',
};

const investmentStrategies: InvestmentPortfolio['strategy'][] = [
  'capital_preservation',
  'balanced',
  'income',
  'growth',
  'global_diversification',
  'custom',
];

const investmentRiskProfiles: InvestmentPortfolio['riskProfile'][] = [
  'conservative',
  'moderate',
  'aggressive',
];

const strategyRiskTargets: Record<
  InvestmentPortfolio['strategy'],
  Record<InvestmentPortfolio['riskProfile'], Record<AllocationBucketKey, number>>
> = {
  capital_preservation: {
    conservative: { fixedIncome: 100, variableIncome: 0, realEstate: 0, international: 0, alternatives: 0 },
    moderate: { fixedIncome: 85, variableIncome: 5, realEstate: 5, international: 5, alternatives: 0 },
    aggressive: { fixedIncome: 70, variableIncome: 10, realEstate: 10, international: 5, alternatives: 5 },
  },
  balanced: {
    conservative: { fixedIncome: 80, variableIncome: 5, realEstate: 10, international: 5, alternatives: 0 },
    moderate: { fixedIncome: 55, variableIncome: 20, realEstate: 15, international: 10, alternatives: 0 },
    aggressive: { fixedIncome: 35, variableIncome: 30, realEstate: 15, international: 15, alternatives: 5 },
  },
  income: {
    conservative: { fixedIncome: 45, variableIncome: 10, realEstate: 35, international: 10, alternatives: 0 },
    moderate: { fixedIncome: 25, variableIncome: 15, realEstate: 40, international: 15, alternatives: 5 },
    aggressive: { fixedIncome: 15, variableIncome: 20, realEstate: 35, international: 20, alternatives: 10 },
  },
  growth: {
    conservative: { fixedIncome: 60, variableIncome: 20, realEstate: 10, international: 10, alternatives: 0 },
    moderate: { fixedIncome: 40, variableIncome: 30, realEstate: 10, international: 15, alternatives: 5 },
    aggressive: { fixedIncome: 15, variableIncome: 45, realEstate: 10, international: 20, alternatives: 10 },
  },
  global_diversification: {
    conservative: { fixedIncome: 50, variableIncome: 10, realEstate: 5, international: 35, alternatives: 0 },
    moderate: { fixedIncome: 25, variableIncome: 15, realEstate: 10, international: 45, alternatives: 5 },
    aggressive: { fixedIncome: 15, variableIncome: 20, realEstate: 5, international: 50, alternatives: 10 },
  },
  custom: {
    conservative: { fixedIncome: 75, variableIncome: 10, realEstate: 10, international: 5, alternatives: 0 },
    moderate: { fixedIncome: 50, variableIncome: 20, realEstate: 15, international: 10, alternatives: 5 },
    aggressive: { fixedIncome: 30, variableIncome: 35, realEstate: 10, international: 15, alternatives: 10 },
  },
};

export const ALLOCATION_PROFILES: AllocationProfile[] = investmentStrategies.flatMap(strategy =>
  investmentRiskProfiles.map(riskProfile => ({
    key: `${strategy}-${riskProfile}`,
    label: `${RISK_PROFILES_LABELS[riskProfile]} / ${STRATEGIES_LABELS[strategy]}`,
    description: allocationProfileDescription(strategy, riskProfile),
    riskProfile,
    strategy,
    targets: strategyRiskTargets[strategy][riskProfile],
  })),
);

const allocationColors = {
  fixedIncome: '#1f7ae0',
  variableIncome: '#169b62',
  realEstate: '#f5b70a',
  international: '#6f58c9',
  alternatives: '#7b818f',
};

const allocationLabels = {
  fixedIncome: 'Renda fixa',
  variableIncome: 'Renda variavel',
  realEstate: 'Fundos imobiliarios',
  international: 'Exterior',
  alternatives: 'Alternativos',
};

export function amountOrFallback(value: number | null | undefined, fallback: number): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : fallback;
}

export function isFixedIncomeAsset(asset: InvestmentPortfolioAsset): boolean {
  return isFixedIncomeType(asset.type);
}

export function isFixedIncomeType(type: InvestmentPortfolioAssetType): boolean {
  return FIXED_INCOME_ASSET_TYPES.has(type);
}

export function investedValue(asset: InvestmentPortfolioAsset): number {
  if (isFixedIncomeAsset(asset)) {
    return amountOrFallback(asset.fixedIncomeInvestedAmount, asset.quantity * asset.averagePrice);
  }

  return asset.quantity * asset.averagePrice;
}

export function currentValue(asset: InvestmentPortfolioAsset): number {
  if (isFixedIncomeAsset(asset)) {
    const grossAmount = amountOrFallback(asset.fixedIncomeGrossAmount, asset.quantity * asset.currentPrice);
    return amountOrFallback(asset.fixedIncomeNetAmount, grossAmount);
  }

  return asset.quantity * asset.currentPrice;
}

export function grossCurrentValue(asset: InvestmentPortfolioAsset): number {
  if (isFixedIncomeAsset(asset)) {
    return amountOrFallback(asset.fixedIncomeGrossAmount, currentValue(asset));
  }

  return currentValue(asset);
}

export function resultValue(asset: InvestmentPortfolioAsset): number {
  return grossCurrentValue(asset) - investedValue(asset);
}

export function netResultValue(asset: InvestmentPortfolioAsset): number {
  return currentValue(asset) - investedValue(asset);
}

export function taxWithheldValue(asset: InvestmentPortfolioAsset): number {
  if (!isFixedIncomeAsset(asset)) return 0;

  return Math.max(0, grossCurrentValue(asset) - currentValue(asset));
}

export function resultPercent(asset: InvestmentPortfolioAsset): number {
  const invested = investedValue(asset);
  return invested > 0 ? (resultValue(asset) / invested) * 100 : 0;
}

export function incomeValue(asset: InvestmentPortfolioAsset): number {
  if (isFixedIncomeAsset(asset)) {
    return Math.max(0, resultValue(asset));
  }

  return asset.annualIncome;
}

export function recommendedAllocationProfile(portfolio?: InvestmentPortfolio): AllocationProfile {
  if (!portfolio) {
    return allocationProfileFor('balanced', 'moderate');
  }

  return allocationProfileFor(portfolio.strategy, portfolio.riskProfile);
}

function allocationProfileFor(
  strategy: InvestmentPortfolio['strategy'],
  riskProfile: InvestmentPortfolio['riskProfile'],
): AllocationProfile {
  return ALLOCATION_PROFILES.find(profile => (
    profile.strategy === strategy && profile.riskProfile === riskProfile
  )) ?? ALLOCATION_PROFILES[0];
}

function allocationProfileDescription(
  strategy: InvestmentPortfolio['strategy'],
  riskProfile: InvestmentPortfolio['riskProfile'],
): string {
  const riskText: Record<InvestmentPortfolio['riskProfile'], string> = {
    conservative: 'mantendo uma base forte em renda fixa',
    moderate: 'equilibrando protecao e ativos de crescimento',
    aggressive: 'aceitando mais volatilidade em busca de retorno',
  };
  const strategyText: Record<InvestmentPortfolio['strategy'], string> = {
    capital_preservation: 'preserva capital e liquidez',
    balanced: 'distribui o patrimonio entre classes sem concentrar demais',
    income: 'prioriza fluxo de caixa recorrente e ativos geradores de renda',
    growth: 'aumenta exposicao a renda variavel e ativos de crescimento',
    global_diversification: 'reduz dependencia do Brasil com maior exposicao internacional',
    custom: 'usa uma referencia neutra para ajustes manuais da carteira',
  };

  return `${STRATEGIES_LABELS[strategy]} ${strategyText[strategy]}, ${riskText[riskProfile]}.`;
}

export function allocationBuckets(
  assets: InvestmentPortfolioAsset[],
  profile: AllocationProfile,
): AllocationBucket[] {
  const total = totalCurrentValue(assets);
  const current = assets.reduce((acc, asset) => {
    const bucket = assetAllocationBucket(asset);
    acc[bucket] += currentValue(asset);
    return acc;
  }, {
    fixedIncome: 0,
    variableIncome: 0,
    realEstate: 0,
    international: 0,
    alternatives: 0,
  } as Record<AllocationBucketKey, number>);

  return (Object.keys(profile.targets) as AllocationBucketKey[]).map(key => ({
    key,
    label: allocationLabels[key],
    current: total > 0 ? (current[key] / total) * 100 : 0,
    target: profile.targets[key],
    color: allocationColors[key],
  }));
}

export function allocationProfileScore(buckets: AllocationBucket[]): number {
  const averageDeviation = buckets.reduce(
    (sum, bucket) => sum + Math.abs(bucket.current - bucket.target),
    0,
  ) / Math.max(1, buckets.length);

  return Math.max(0, Math.min(100, Math.round(100 - averageDeviation * 2)));
}

export function allocationProfileMessage(assetCount: number, score: number): string {
  if (assetCount === 0) return 'Adicione ativos para comparar sua carteira com um perfil educativo.';
  if (score >= 85) return 'Sua carteira esta bem alinhada ao perfil escolhido.';
  if (score >= 65) return 'Sua carteira esta perto do perfil. Ajustes pequenos ja melhoram o equilibrio.';
  return 'Sua carteira esta distante do perfil. Use os percentuais como guia de estudo antes de aportar.';
}

export function allocationGap(bucket: AllocationBucket): number {
  return bucket.current - bucket.target;
}

export function allocation(asset: InvestmentPortfolioAsset, totalCurrent: number): number {
  return totalCurrent > 0 ? (currentValue(asset) / totalCurrent) * 100 : 0;
}

export function targetGap(asset: InvestmentPortfolioAsset, totalCurrent: number): number {
  return allocation(asset, totalCurrent) - asset.targetAllocation;
}

export function totalInvestedValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + investedValue(asset), 0);
}

export function totalCurrentValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + currentValue(asset), 0);
}

export function totalResultValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + resultValue(asset), 0);
}

export function totalNetResultValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + netResultValue(asset), 0);
}

export function totalTaxWithheldValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + taxWithheldValue(asset), 0);
}

export function annualIncomeValue(assets: InvestmentPortfolioAsset[]): number {
  return assets.reduce((sum, asset) => sum + incomeValue(asset), 0);
}

export function totalResultPercent(assets: InvestmentPortfolioAsset[]): number {
  const invested = totalInvestedValue(assets);
  return invested > 0 ? (totalResultValue(assets) / invested) * 100 : 0;
}

export function portfolioYield(assets: InvestmentPortfolioAsset[]): number {
  const total = totalCurrentValue(assets);
  return total > 0 ? (annualIncomeValue(assets) / total) * 100 : 0;
}

export function snapshotEvolution(
  snapshots: InvestmentAssetSnapshot[],
): InvestmentSnapshotEvolutionPoint[] {
  const grouped = new Map<string, InvestmentSnapshotEvolutionPoint>();

  for (const snapshot of snapshots) {
    const current = grouped.get(snapshot.snapshotDate) ?? {
      date: snapshot.snapshotDate,
      gross: 0,
      net: 0,
      result: 0,
    };
    current.gross += snapshot.grossAmount;
    current.net += snapshot.netAmount;
    current.result += snapshot.resultAmount;
    grouped.set(snapshot.snapshotDate, current);
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
}

export function lastSnapshotDateLabel(snapshots: InvestmentAssetSnapshot[]): string {
  const latest = snapshotEvolution(snapshots)[0]?.date;
  return latest ? formatShortDate(latest) : 'Sem historico';
}

export function typeLabel(asset: InvestmentPortfolioAsset): string {
  const labels: Record<InvestmentPortfolioAsset['type'], string> = {
    stock: 'Acao',
    fii: 'FII',
    etf: 'ETF',
    bdr: 'BDR',
    reit: 'REIT',
    international_stock: 'Acao Intl.',
    cdb: 'CDB',
    lci_lca: 'LCI/LCA',
    treasury: 'Tesouro',
    crypto: 'Cripto',
    fund: 'Fundo',
    other: 'Outro',
  };

  return labels[asset.type];
}

export function fixedIncomeSummary(asset: InvestmentPortfolioAsset): string {
  if (!isFixedIncomeAsset(asset)) {
    return asset.sector || 'Sem setor';
  }

  const parts = [
    fixedIncomeRateLabel(asset),
    fixedIncomeLiquidityLabel(asset),
    asset.fixedIncomeMaturityDate ? `vence em ${formatShortDate(asset.fixedIncomeMaturityDate)}` : '',
    asset.fixedIncomeTaxExempt ? 'isento de IR' : '',
  ].filter(Boolean);

  return parts.join(' - ') || 'Renda fixa';
}

export function fixedIncomeRateLabel(asset: InvestmentPortfolioAsset): string {
  if (!asset.fixedIncomeIndexer || asset.fixedIncomeRate === null || asset.fixedIncomeRate === undefined) {
    return typeLabel(asset);
  }

  const indexer = {
    cdi: 'CDI',
    selic: 'Selic',
    ipca: 'IPCA',
    prefixed: 'Prefixado',
    igpm: 'IGP-M',
    other: 'Outro',
  }[asset.fixedIncomeIndexer];
  const rate = asset.fixedIncomeRate.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (asset.fixedIncomeRateType === 'percent_indexer') return `${rate}% do ${indexer}`;
  if (asset.fixedIncomeRateType === 'indexer_plus') return `${indexer} + ${rate}%`;

  return `${rate}% a.a.`;
}

export function fixedIncomeLiquidityLabel(asset: InvestmentPortfolioAsset): string {
  const labels: Record<NonNullable<InvestmentPortfolioAsset['fixedIncomeLiquidity']>, string> = {
    daily: 'liquidez diaria',
    maturity: 'liquidez no vencimento',
    custom: 'liquidez personalizada',
  };

  return asset.fixedIncomeLiquidity ? labels[asset.fixedIncomeLiquidity] : '';
}

export function formatShortDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function assetAllocationBucket(asset: InvestmentPortfolioAsset) {
  if (isFixedIncomeAsset(asset)) return 'fixedIncome';

  if (
    asset.type === 'crypto' ||
    asset.type === 'fund' ||
    asset.type === 'other'
  ) {
    return 'alternatives';
  }

  if (asset.type === 'fii' || asset.type === 'reit') {
    return 'realEstate';
  }

  if (
    asset.type === 'bdr' ||
    asset.type === 'international_stock'
  ) {
    return 'international';
  }

  return 'variableIncome';
}
