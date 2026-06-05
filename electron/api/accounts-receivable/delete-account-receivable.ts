import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsReceivable } from '../../db/schemas';

export function registerDeleteAccountReceivable() {
  ipcMain.handle('accounts-receivable:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(accountsReceivable)
      .where(eq(accountsReceivable.id, id))
      .returning();

    return deleted ?? null;
  });
}
