import { ipcMain } from 'electron';
import { db } from '../../db';
import { assets } from '../../db/schemas';
import type { NewAsset } from '../../../src/app/models/asset.model';

/**
 * POST /assets
 * Cadastra um novo ativo (ação, FII, CDB, etc.).
 */
export function registerInsertAsset() {
  ipcMain.handle('assets:insert', async (_, data: NewAsset) => {
    const [inserted] = await db.insert(assets).values(data).returning();
    return inserted;
  });
}
