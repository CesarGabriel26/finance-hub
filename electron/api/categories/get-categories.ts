import { ipcMain } from 'electron';
import { db } from '../../db';
import { categories } from '../../db/schemas';
import { buildTableFilter } from '../../utils/filters'

/**
 * GET /categories
 * Lista todas as categorias.
 */
export function registerGetCategories() {
  ipcMain.handle('categories:get-all', async (_, filters?: { type?: string, name?: string }) => {
    if (filters) {
      const filter = buildTableFilter(categories, filters)
      return db.select().from(categories).where(filter);
    }
    return db.select().from(categories);
  });
}
