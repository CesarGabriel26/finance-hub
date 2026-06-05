import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountsReceivable } from '../../db/schemas';
import type { NewAccountReceivable } from '../../../src/app/models/account-receivable.model';

export function registerUpdateAccountReceivable() {
  ipcMain.handle(
    'accounts-receivable:update',
    async (_, id: string, data: Partial<NewAccountReceivable>) => {
      const [updated] = await db
        .update(accountsReceivable)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(accountsReceivable.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
