import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolioAssets } from '../../db/schemas';

export function registerDeleteInvestmentPortfolioAsset() {
  ipcMain.handle('investment-portfolios:delete-asset', async (_, id: string) => {
    const [deleted] = await db
      .delete(investmentPortfolioAssets)
      .where(eq(investmentPortfolioAssets.id, id))
      .returning();

    return deleted ?? null;
  });
}
