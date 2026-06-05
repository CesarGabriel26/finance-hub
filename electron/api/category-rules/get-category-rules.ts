import { ipcMain } from 'electron';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { categories, categoryRules } from '../../db/schemas';

export function registerGetCategoryRules() {
  ipcMain.handle('category-rules:get-all', async () =>
    db
      .select({
        id: categoryRules.id,
        keyword: categoryRules.keyword,
        categoryId: categoryRules.categoryId,
        priority: categoryRules.priority,
        createdByUser: categoryRules.createdByUser,
        createdAt: categoryRules.createdAt,
        updatedAt: categoryRules.updatedAt,
        categoryName: categories.name,
        categoryType: categories.type,
      })
      .from(categoryRules)
      .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
      .orderBy(asc(categoryRules.keyword)),
  );
}
