import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsPayable } from '../../db/schemas';
import type { NewAccountPayable } from '../../../src/app/models/account-payable.model';

export function registerUpdateAccountPayable() {
  ipcMain.handle(
    'accounts-payable:update',
    async (_, id: string, data: Partial<NewAccountPayable>) => {
      const [updated] = await db
        .update(accountsPayable)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(accountsPayable.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
