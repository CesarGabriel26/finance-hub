import { ipcMain } from 'electron';
import { db } from '../../db';
import { assetTransactions } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /asset-transactions/:id
 * Remove uma movimentação de ativo pelo ID.
 */
export function registerDeleteAssetTransaction() {
  ipcMain.handle('asset-transactions:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(assetTransactions)
      .where(eq(assetTransactions.id, id))
      .returning();

    return deleted ?? null;
  });
}
