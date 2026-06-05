import { ipcMain } from 'electron';
import { db } from '../../db';
import { transactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /transactions/:id
 * Remove uma transação pelo ID.
 */
export function registerDeleteTransaction() {
  ipcMain.handle('transactions:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    return deleted ?? null;
  });
}
