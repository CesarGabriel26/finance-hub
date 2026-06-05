import { ipcMain } from 'electron';
import { db } from '../../db';
import { transactions } from '../../db/schemas';
import { eq, desc } from 'drizzle-orm';
import { buildTableFilter } from '../../utils/filters';

/**
 * GET /transactions?accountId=:id
 * Lista todas as transações de uma conta, ordenadas por data decrescente.
 */
export function registerGetTransactions() {
  ipcMain.handle('transactions:get-all', async (_, query?: string | Record<string, unknown>) => {
    if (typeof query === 'string' && query) {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, query))
        .orderBy(desc(transactions.date));
    }

    const filter = typeof query === 'object' && query
      ? buildTableFilter(transactions, query)
      : undefined;

    if (filter) {
      return db
        .select()
        .from(transactions)
        .where(filter)
        .orderBy(desc(transactions.date));
    }

    return db.select().from(transactions).orderBy(desc(transactions.date));
  });
}
