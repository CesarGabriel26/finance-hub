import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolios } from '../../db/schemas';
import type { NewInvestmentPortfolio } from '../../../src/app/models/investment-portfolio.model';

export function registerUpdateInvestmentPortfolio() {
  ipcMain.handle(
    'investment-portfolios:update',
    async (_, id: string, data: Partial<NewInvestmentPortfolio>) => {
      const [updated] = await db
        .update(investmentPortfolios)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(investmentPortfolios.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
