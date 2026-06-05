import { ipcMain } from 'electron';
import { db } from '../../db';
import { assets } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewAsset } from '../../../src/app/models/asset.model';

/**
 * PUT /assets/:id
 * Atualiza os dados de um ativo.
 */
export function registerUpdateAsset() {
  ipcMain.handle(
    'assets:update',
    async (_, id: string, data: Partial<NewAsset>) => {
      const [updated] = await db
        .update(assets)
        .set(data)
        .where(eq(assets.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
