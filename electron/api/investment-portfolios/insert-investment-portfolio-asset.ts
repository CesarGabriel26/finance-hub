import { ipcMain } from 'electron';
import { db } from '../../db';
import { investmentPortfolioAssets } from '../../db/schemas';
import type { NewInvestmentPortfolioAsset } from '../../../src/app/models/investment-portfolio.model';

export function registerInsertInvestmentPortfolioAsset() {
  ipcMain.handle('investment-portfolios:insert-asset', async (_, data: NewInvestmentPortfolioAsset) => {
    const [inserted] = await db.insert(investmentPortfolioAssets).values(data).returning();
    return inserted;
  });
}
