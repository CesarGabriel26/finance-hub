import { ipcMain } from 'electron';
import { db } from '../../db';
import { accounts } from '../../db/schemas';
import { buildTableFilter } from '../../utils/filters'

/**
 * GET /accounts
 * Lista todas as contas.
 */
export function registerGetAccounts() {
  ipcMain.handle('accounts:get-all', async (_, filters?: { type?: string, name?: string }) => {
    if (filters) {
      const filter = buildTableFilter(accounts, filters)
      return db.select().from(accounts).where(filter);
    }
    return db.select().from(accounts);
  });
}
