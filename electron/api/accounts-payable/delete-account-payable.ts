import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsPayable } from '../../db/schemas';

export function registerDeleteAccountPayable() {
  ipcMain.handle('accounts-payable:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(accountsPayable)
      .where(eq(accountsPayable.id, id))
      .returning();

    return deleted ?? null;
  });
}
