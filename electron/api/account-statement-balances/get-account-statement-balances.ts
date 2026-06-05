import { ipcMain } from 'electron';
import { asc } from 'drizzle-orm';
import { db } from '../../db';
import { accountStatementBalances } from '../../db/schemas';
import { buildTableFilter } from '../../utils/filters';

export function registerGetAccountStatementBalances(): void {
  ipcMain.handle('account-statement-balances:get-all', async (_, filters?: Record<string, unknown>) => {
    const filter = filters ? buildTableFilter(accountStatementBalances, filters) : undefined;

    if (filter) {
      return db
        .select()
        .from(accountStatementBalances)
        .where(filter)
        .orderBy(asc(accountStatementBalances.period));
    }

    return db
      .select()
      .from(accountStatementBalances)
      .orderBy(asc(accountStatementBalances.period));
  });
}
