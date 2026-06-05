import { ipcMain } from 'electron';
import { db } from '../../db';
import { budgets } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /budgets/:id
 * Retorna um orçamento pelo ID.
 */
export function registerGetBudgetById() {
  ipcMain.handle('budgets:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1);

    return row ?? null;
  });
}
