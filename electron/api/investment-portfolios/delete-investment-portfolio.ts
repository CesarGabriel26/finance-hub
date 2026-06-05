import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolios } from '../../db/schemas';

export function registerDeleteInvestmentPortfolio() {
  ipcMain.handle('investment-portfolios:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(investmentPortfolios)
      .where(eq(investmentPortfolios.id, id))
      .returning();

    return deleted ?? null;
  });
}
