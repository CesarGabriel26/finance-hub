import { ipcMain } from 'electron';
import { db } from '../../db';
import { transactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewTransaction } from '../../../src/app/models/transaction.model';

/**
 * PUT /transactions/:id
 * Atualiza os dados de uma transação existente.
 */
export function registerUpdateTransaction() {
  ipcMain.handle(
    'transactions:update',
    async (_, id: string, data: Partial<NewTransaction>) => {
      const [updated] = await db
        .update(transactions)
        .set(data)
        .where(eq(transactions.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
