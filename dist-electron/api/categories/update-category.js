"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateCategory = registerUpdateCategory;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /categories/:id
 * Atualiza uma categoria existente.
 */
function registerUpdateCategory() {
    electron_1.ipcMain.handle('categories:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.categories)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.categories.id, id))
            .returning();
        return updated ?? null;
    });
}
