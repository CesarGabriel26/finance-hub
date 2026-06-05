import { ipcMain } from 'electron';
import { db } from '../../db';
import { accountsReceivable } from '../../db/schemas';
import type { NewAccountReceivable } from '../../../src/app/models/account-receivable.model';

export function registerInsertAccountReceivable() {
  ipcMain.handle('accounts-receivable:insert', async (_, data: NewAccountReceivable) => {
    const [inserted] = await db.insert(accountsReceivable).values(data).returning();
    return inserted;
  });
}
