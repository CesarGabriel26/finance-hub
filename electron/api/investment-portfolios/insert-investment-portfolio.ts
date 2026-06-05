import { ipcMain } from 'electron';
import { db } from '../../db';
import { investmentPortfolios } from '../../db/schemas';
import type { NewInvestmentPortfolio } from '../../../src/app/models/investment-portfolio.model';

export function registerInsertInvestmentPortfolio() {
  ipcMain.handle('investment-portfolios:insert', async (_, data: NewInvestmentPortfolio) => {
    const [inserted] = await db.insert(investmentPortfolios).values(data).returning();
    return inserted;
  });
}
