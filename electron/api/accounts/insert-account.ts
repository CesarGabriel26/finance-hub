import { ipcMain } from 'electron';
import { db } from '../../db';
import { accounts } from '../../db/schemas';
import type { NewAccount } from '../../../src/app/models/account.model';

/**
 * POST /accounts
 * Cria uma nova conta.
 */
export function registerInsertAccount() {
  ipcMain.handle('accounts:insert', async (_, data: NewAccount) => {
    const [inserted] = await db.insert(accounts).values(data).returning();
    return inserted;
  });
}
