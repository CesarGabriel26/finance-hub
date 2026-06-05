import { ipcMain } from 'electron';
import { db } from '../../db';
import { categories } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * DELETE /categories/:id
 * Remove uma categoria. Subcategorias terão parentId definido como NULL.
 */
export function registerDeleteCategory() {
  ipcMain.handle('categories:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return deleted ?? null;
  });
}
