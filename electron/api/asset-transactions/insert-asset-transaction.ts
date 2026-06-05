import { ipcMain } from 'electron';
import { db } from '../../db';
import { assetTransactions } from '../../db/schemas';
import type { NewAssetTransaction } from '../../../src/app/models/asset-transaction.model';

/**
 * POST /asset-transactions
 * Registra uma compra, venda, dividendo ou juros de um ativo.
 */
export function registerInsertAssetTransaction() {
  ipcMain.handle('asset-transactions:insert', async (_, data: NewAssetTransaction) => {
    const [inserted] = await db.insert(assetTransactions).values(data).returning();
    return inserted;
  });
}
