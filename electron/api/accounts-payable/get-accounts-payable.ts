import { ipcMain } from 'electron';
import { asc } from 'drizzle-orm';
import { db } from '../../db';
import { accountsPayable } from '../../db/schemas';
import { buildTableFilter } from '../../utils/filters';

export function registerGetAccountsPayable() {
  ipcMain.handle('accounts-payable:get-all', async (_, filters?: Record<string, unknown>) => {
    const filter = filters ? buildTableFilter(accountsPayable, filters) : undefined;

    if (filter) {
      return db
        .select()
        .from(accountsPayable)
        .where(filter)
        .orderBy(asc(accountsPayable.dueDate));
    }

    return db.select().from(accountsPayable).orderBy(asc(accountsPayable.dueDate));
  });
}
