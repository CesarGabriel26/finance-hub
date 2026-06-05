import { ipcMain } from 'electron';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import {
  investmentAssetSnapshots,
  type InvestmentPortfolioAsset,
  type NewInvestmentAssetSnapshot,
} from '../../db/schemas';

export function buildAssetSnapshot(
  asset: InvestmentPortfolioAsset,
  snapshotDate = new Date().toISOString().slice(0, 10),
): NewInvestmentAssetSnapshot {
  const fixedIncome = ['cdb', 'lci_lca', 'treasury'].includes(asset.type);
  const investedAmount = amountOrFallback(
    fixedIncome ? asset.fixedIncomeInvestedAmount : null,
    asset.quantity * asset.averagePrice,
  );
  const grossAmount = amountOrFallback(
    fixedIncome ? asset.fixedIncomeGrossAmount : null,
    asset.quantity * asset.currentPrice,
  );
  const netAmount = amountOrFallback(
    fixedIncome ? asset.fixedIncomeNetAmount : null,
    grossAmount,
  );

  return {
    assetId: asset.id,
    portfolioId: asset.portfolioId,
    snapshotDate,
    investedAmount,
    grossAmount,
    netAmount,
    resultAmount: grossAmount - investedAmount,
    quantity: asset.quantity,
    currentPrice: asset.currentPrice,
    notes: 'Snapshot automatico',
  };
}

export async function upsertInvestmentAssetSnapshot(
  data: NewInvestmentAssetSnapshot,
) {
  const [existing] = await db
    .select()
    .from(investmentAssetSnapshots)
    .where(and(
      eq(investmentAssetSnapshots.assetId, data.assetId),
      eq(investmentAssetSnapshots.snapshotDate, data.snapshotDate),
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(investmentAssetSnapshots)
      .set(data)
      .where(eq(investmentAssetSnapshots.id, existing.id))
      .returning();

    return updated;
  }

  const [inserted] = await db.insert(investmentAssetSnapshots).values(data).returning();
  return inserted;
}

export function registerGetInvestmentAssetSnapshots() {
  ipcMain.handle('investment-portfolios:get-asset-snapshots', async (_, portfolioId: string) => {
    return db
      .select()
      .from(investmentAssetSnapshots)
      .where(eq(investmentAssetSnapshots.portfolioId, portfolioId))
      .orderBy(desc(investmentAssetSnapshots.snapshotDate));
  });
}

export function registerInsertInvestmentAssetSnapshot() {
  ipcMain.handle(
    'investment-portfolios:insert-asset-snapshot',
    async (_, data: NewInvestmentAssetSnapshot) => upsertInvestmentAssetSnapshot(data),
  );
}

function amountOrFallback(value: number | null | undefined, fallback: number): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : fallback;
}
