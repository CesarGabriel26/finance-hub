import { ipcMain } from 'electron';
import { db } from '../../db';
import { savingGoals } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /saving-goals/:id
 * Retorna uma meta de poupança pelo ID.
 */
export function registerGetSavingGoalById() {
  ipcMain.handle('saving-goals:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(savingGoals)
      .where(eq(savingGoals.id, id))
      .limit(1);

    return row ?? null;
  });
}
