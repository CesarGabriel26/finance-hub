import { ipcMain } from 'electron';
import { db } from '../../db';
import { accountsPayable } from '../../db/schemas';
import type { NewAccountPayable } from '../../../src/app/models/account-payable.model';

export function registerInsertAccountPayable() {
  ipcMain.handle('accounts-payable:insert', async (_, data: NewAccountPayable) => {
    const [inserted] = await db.insert(accountsPayable).values(data).returning();
    return inserted;
  });
}
