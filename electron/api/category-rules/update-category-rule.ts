import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { categoryRules } from '../../db/schemas';
import type { NewCategoryRule } from '../../../src/app/models/category.model';

export function registerUpdateCategoryRule() {
  ipcMain.handle('category-rules:update', async (_, id: string, data: Partial<NewCategoryRule>) => {
    const [updated] = await db
      .update(categoryRules)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categoryRules.id, id))
      .returning();

    return updated ?? null;
  });
}
