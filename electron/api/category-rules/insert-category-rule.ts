import { ipcMain } from 'electron';
import { db } from '../../db';
import { categoryRules } from '../../db/schemas';
import type { NewCategoryRule } from '../../../src/app/models/category.model';

export function registerInsertCategoryRule() {
  ipcMain.handle('category-rules:insert', async (_, data: NewCategoryRule) => {
    const [inserted] = await db.insert(categoryRules).values(data).returning();
    return inserted;
  });
}
