import { ipcMain } from 'electron';
import { db } from '../../db';
import { budgets } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewBudget } from '../../../src/app/models/budget.model';

/**
 * PUT /budgets/:id
 * Atualiza o teto de orçamento de uma categoria.
 */
export function registerUpdateBudget() {
  ipcMain.handle(
    'budgets:update',
    async (_, id: string, data: Partial<NewBudget>) => {
      const [updated] = await db
        .update(budgets)
        .set(data)
        .where(eq(budgets.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
