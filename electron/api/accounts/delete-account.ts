import { ipcMain } from 'electron';
import { db } from '../../db';
import { accounts } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /accounts/:id
 * Remove uma conta pelo ID.
 * Atenção: transações vinculadas serão removidas em cascata (onDelete: cascade).
 */
export function registerDeleteAccount() {
  ipcMain.handle('accounts:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();

    return deleted ?? null;
  });
}
