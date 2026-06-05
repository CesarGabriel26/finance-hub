import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolioAssets } from '../../db/schemas';
import type { NewInvestmentPortfolioAsset } from '../../../src/app/models/investment-portfolio.model';
import { buildAssetSnapshot, upsertInvestmentAssetSnapshot } from './investment-asset-snapshots';

export function registerUpdateInvestmentPortfolioAsset() {
  ipcMain.handle(
    'investment-portfolios:update-asset',
    async (_, id: string, data: Partial<NewInvestmentPortfolioAsset>) => {
      const [updated] = await db
        .update(investmentPortfolioAssets)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(investmentPortfolioAssets.id, id))
        .returning();

      if (updated) {
        await upsertInvestmentAssetSnapshot(buildAssetSnapshot(updated));
      }

      return updated ?? null;
    },
  );
}
