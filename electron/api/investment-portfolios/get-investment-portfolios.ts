import { ipcMain } from 'electron';
import { asc } from 'drizzle-orm';
import { db } from '../../db';
import { investmentPortfolios } from '../../db/schemas';

export function registerGetInvestmentPortfolios() {
  ipcMain.handle('investment-portfolios:get-all', async () => {
    return db.select().from(investmentPortfolios).orderBy(asc(investmentPortfolios.createdAt));
  });
}
