import { ipcMain } from 'electron';
import { db } from '../../db';
import { assets } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /assets/:id
 * Retorna um ativo pelo ID.
 */
export function registerGetAssetById() {
  ipcMain.handle('assets:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);

    return row ?? null;
  });
}
