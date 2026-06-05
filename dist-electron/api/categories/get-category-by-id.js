"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetCategoryById = registerGetCategoryById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /categories/:id
 * Retorna uma categoria pelo ID.
 */
function registerGetCategoryById() {
    electron_1.ipcMain.handle('categories:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.categories)
            .where((0, drizzle_orm_1.eq)(schemas_1.categories.id, id))
            .limit(1);
        return row ?? null;
    });
}
