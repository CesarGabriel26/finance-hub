import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolios } from '../../db/schemas';

export function registerGetInvestmentPortfolioById() {
  ipcMain.handle('investment-portfolios:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(investmentPortfolios)
      .where(eq(investmentPortfolios.id, id))
      .limit(1);

    return row ?? null;
  });
}
