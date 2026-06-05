import { ipcMain } from 'electron';
import { db } from '../../db';
import { categories } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewCategory } from '../../../src/app/models/category.model';

/**
 * PUT /categories/:id
 * Atualiza uma categoria existente.
 */
export function registerUpdateCategory() {
  ipcMain.handle(
    'categories:update',
    async (_, id: string, data: Partial<NewCategory>) => {
      const [updated] = await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
