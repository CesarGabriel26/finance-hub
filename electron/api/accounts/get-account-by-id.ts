import { ipcMain } from 'electron';
import { db } from '../../db';
import { accounts } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /accounts/:id
 * Retorna uma conta pelo ID.
 */
export function registerGetAccountById() {
  ipcMain.handle('accounts:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    return row ?? null;
  });
}
