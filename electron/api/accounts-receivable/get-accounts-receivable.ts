import { ipcMain } from 'electron';
import { asc } from 'drizzle-orm';
import { db } from '../../db';
import { accountsReceivable } from '../../db/schemas';
import { buildTableFilter } from '../../utils/filters';

export function registerGetAccountsReceivable() {
  ipcMain.handle('accounts-receivable:get-all', async (_, filters?: Record<string, unknown>) => {
    const filter = filters ? buildTableFilter(accountsReceivable, filters) : undefined;

    if (filter) {
      return db
        .select()
        .from(accountsReceivable)
        .where(filter)
        .orderBy(asc(accountsReceivable.dueDate));
    }

    return db.select().from(accountsReceivable).orderBy(asc(accountsReceivable.dueDate));
  });
}
