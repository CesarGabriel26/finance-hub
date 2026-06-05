import { ipcMain } from 'electron';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolioAssets } from '../../db/schemas';

export function registerGetInvestmentPortfolioAssets() {
  ipcMain.handle('investment-portfolios:get-assets', async (_, portfolioId: string) => {
    return db
      .select()
      .from(investmentPortfolioAssets)
      .where(eq(investmentPortfolioAssets.portfolioId, portfolioId))
      .orderBy(asc(investmentPortfolioAssets.ticker));
  });
}
