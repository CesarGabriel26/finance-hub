import { ipcMain } from 'electron';
import { db } from '../../db';
import { assetTransactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /asset-transactions/:id
 * Retorna uma movimentação de ativo pelo ID.
 */
export function registerGetAssetTransactionById() {
  ipcMain.handle('asset-transactions:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(assetTransactions)
      .where(eq(assetTransactions.id, id))
      .limit(1);

    return row ?? null;
  });
}
