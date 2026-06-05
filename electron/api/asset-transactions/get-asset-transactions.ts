import { ipcMain } from 'electron';
import { db } from '../../db';
import { assetTransactions } from '../../db/schemas';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /asset-transactions?assetId=:id
 * Lista todas as movimentações de um ativo, ordenadas por data decrescente.
 */
export function registerGetAssetTransactions() {
  ipcMain.handle('asset-transactions:get-all', async (_, assetId: string) => {
    return db
      .select()
      .from(assetTransactions)
      .where(eq(assetTransactions.assetId, assetId))
      .orderBy(desc(assetTransactions.date));
  });
}
