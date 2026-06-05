import { ipcMain } from 'electron';
import { db } from '../../db';
import { assets } from '../../db/schemas';

/**
 * GET /assets
 * Lista todos os ativos cadastrados.
 */
export function registerGetAssets() {
  ipcMain.handle('assets:get-all', async () => {
    return db.select().from(assets);
  });
}
