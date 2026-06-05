"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteCategory = registerDeleteCategory;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /categories/:id
 * Remove uma categoria. Subcategorias terão parentId definido como NULL.
 */
function registerDeleteCategory() {
    electron_1.ipcMain.handle('categories:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.categories)
            .where((0, drizzle_orm_1.eq)(schemas_1.categories.id, id))
            .returning();
        return deleted ?? null;
    });
}
