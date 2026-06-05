import { ipcMain } from 'electron';
import { db } from '../../db';
import { assets } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /assets/:id
 * Remove um ativo. Transações vinculadas serão removidas em cascata.
 */
export function registerDeleteAsset() {
  ipcMain.handle('assets:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();

    return deleted ?? null;
  });
}
