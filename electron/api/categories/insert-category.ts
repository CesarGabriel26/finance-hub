import { ipcMain } from 'electron';
import { db } from '../../db';
import { categories } from '../../db/schemas';
import type { NewCategory } from '../../../src/app/models/category.model';

/**
 * POST /categories
 * Cria uma nova categoria (pode ser subcategoria via parentId).
 */
export function registerInsertCategory() {
  ipcMain.handle('categories:insert', async (_, data: NewCategory) => {
    const [inserted] = await db.insert(categories).values(data).returning();
    return inserted;
  });
}
