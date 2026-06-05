import { ipcMain } from 'electron';
import { db } from '../../db';
import { savingGoals } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /saving-goals/:id
 * Remove uma meta de poupança pelo ID.
 */
export function registerDeleteSavingGoal() {
  ipcMain.handle('saving-goals:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(savingGoals)
      .where(eq(savingGoals.id, id))
      .returning();

    return deleted ?? null;
  });
}
