import { ipcMain } from 'electron';
import { db } from '../../db';
import { budgets } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /budgets/:id
 * Remove um orçamento pelo ID.
 */
export function registerDeleteBudget() {
  ipcMain.handle('budgets:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(budgets)
      .where(eq(budgets.id, id))
      .returning();

    return deleted ?? null;
  });
}
