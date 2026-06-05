import { ipcMain } from 'electron';
import { db } from '../../db';
import { transactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /transactions/:id
 * Retorna uma transação específica pelo ID.
 */
export function registerGetTransactionById() {
  ipcMain.handle('transactions:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    return row ?? null;
  });
}
