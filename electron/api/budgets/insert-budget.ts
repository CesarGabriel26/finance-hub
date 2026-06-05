import { ipcMain } from 'electron';
import { db } from '../../db';
import { budgets } from '../../db/schemas';
import type { NewBudget } from '../../../src/app/models/budget.model';

/**
 * POST /budgets
 * Cria um teto de orçamento para uma categoria em um mês/ano.
 * A constraint única (categoryId + month + year) impede duplicatas.
 */
export function registerInsertBudget() {
  ipcMain.handle('budgets:insert', async (_, data: NewBudget) => {
    const [inserted] = await db.insert(budgets).values(data).returning();
    return inserted;
  });
}
