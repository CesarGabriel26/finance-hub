import { ipcMain } from 'electron';
import { db } from '../../db';
import { investmentPortfolioAssets } from '../../db/schemas';
import type { NewInvestmentPortfolioAsset } from '../../../src/app/models/investment-portfolio.model';
import { buildAssetSnapshot, upsertInvestmentAssetSnapshot } from './investment-asset-snapshots';

export function registerInsertInvestmentPortfolioAsset() {
  ipcMain.handle('investment-portfolios:insert-asset', async (_, data: NewInvestmentPortfolioAsset) => {
    const [inserted] = await db.insert(investmentPortfolioAssets).values(data).returning();
    await upsertInvestmentAssetSnapshot(buildAssetSnapshot(inserted));
    return inserted;
  });
}
