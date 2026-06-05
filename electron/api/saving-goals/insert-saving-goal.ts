import { ipcMain } from 'electron';
import { db } from '../../db';
import { savingGoals } from '../../db/schemas';
import type { NewSavingGoal } from '../../../src/app/models/saving-goal.model';

/**
 * POST /saving-goals
 * Cria uma nova meta de poupança.
 */
export function registerInsertSavingGoal() {
  ipcMain.handle('saving-goals:insert', async (_, data: NewSavingGoal) => {
    const [inserted] = await db.insert(savingGoals).values(data).returning();
    return inserted;
  });
}
