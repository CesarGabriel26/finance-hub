import { ipcMain } from 'electron';
import { db } from '../../db';
import { budgets } from '../../db/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * GET /budgets?month=:month&year=:year
 * Lista os orçamentos de um período específico.
 */
export function registerGetBudgets() {
  ipcMain.handle(
    'budgets:get-all',
    async (_, month: number, year: number) => {
      return db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.periodMonth, month),
            eq(budgets.periodYear, year),
          ),
        );
    },
  );
}
