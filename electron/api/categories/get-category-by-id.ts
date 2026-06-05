import { ipcMain } from 'electron';
import { db } from '../../db';
import { categories } from '../../db/schemas';
import { eq } from 'drizzle-orm';

/**
 * GET /categories/:id
 * Retorna uma categoria pelo ID.
 */
export function registerGetCategoryById() {
  ipcMain.handle('categories:get-by-id', async (_, id: string) => {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return row ?? null;
  });
}
