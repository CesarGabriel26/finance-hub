import { ipcMain } from 'electron';
import { db } from '../../db';
import { savingGoals } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewSavingGoal } from '../../../src/app/models/saving-goal.model';

/**
 * PUT /saving-goals/:id
 * Atualiza os dados de uma meta (ex: incrementar currentAmount após um depósito).
 */
export function registerUpdateSavingGoal() {
  ipcMain.handle(
    'saving-goals:update',
    async (_, id: string, data: Partial<NewSavingGoal>) => {
      const [updated] = await db
        .update(savingGoals)
        .set(data)
        .where(eq(savingGoals.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
