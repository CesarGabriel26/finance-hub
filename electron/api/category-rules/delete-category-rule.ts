import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { categoryRules } from '../../db/schemas';

export function registerDeleteCategoryRule() {
  ipcMain.handle('category-rules:delete', async (_, id: string) => {
    const [deleted] = await db
      .delete(categoryRules)
      .where(eq(categoryRules.id, id))
      .returning();

    return deleted ?? null;
  });
}
