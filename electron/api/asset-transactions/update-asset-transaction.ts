import { ipcMain } from 'electron';
import { db } from '../../db';
import { assetTransactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewAssetTransaction } from '../../../src/app/models/asset-transaction.model';

/**
 * PUT /asset-transactions/:id
 * Corrige os dados de uma movimentação de ativo.
 */
export function registerUpdateAssetTransaction() {
  ipcMain.handle(
    'asset-transactions:update',
    async (_, id: string, data: Partial<NewAssetTransaction>) => {
      const [updated] = await db
        .update(assetTransactions)
        .set(data)
        .where(eq(assetTransactions.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
