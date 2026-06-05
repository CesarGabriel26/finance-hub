import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsReceivable } from '../../db/schemas';

export function registerGetAccountReceivableById() {
  ipcMain.handle('accounts-receivable:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(accountsReceivable)
      .where(eq(accountsReceivable.id, id))
      .limit(1);

    return row ?? null;
  });
}
