import { ipcMain } from 'electron';
import { db } from '../../db';
import { savingGoals } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /saving-goals
 * Lista todas as metas de poupança.
 */
export function registerGetSavingGoals() {
  ipcMain.handle('saving-goals:get-all', async () => {
    return db.select().from(savingGoals);
  });
}
