import { ipcMain } from 'electron';
import { db } from '../../db';
import { transactions } from '../../db/schemas';
import type { NewTransaction } from '../../../src/app/models/transaction.model';

/**
 * POST /transactions
 * Insere uma ou várias transações em lote (ideal para importação OFX).
 */
export function registerInsertTransactions() {
  ipcMain.handle('transactions:insert', async (_, data: NewTransaction | NewTransaction[]) => {
    const payload = Array.isArray(data) ? data : [data];
    return db.insert(transactions).values(payload).returning();
  });
}
