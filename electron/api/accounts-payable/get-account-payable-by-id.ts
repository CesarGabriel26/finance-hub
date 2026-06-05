import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsPayable } from '../../db/schemas';

export function registerGetAccountPayableById() {
  ipcMain.handle('accounts-payable:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.id, id))
      .limit(1);

    return row ?? null;
  });
}
