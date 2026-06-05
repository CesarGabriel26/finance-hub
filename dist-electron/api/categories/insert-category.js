"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertCategory = registerInsertCategory;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /categories
 * Cria uma nova categoria (pode ser subcategoria via parentId).
 */
function registerInsertCategory() {
    electron_1.ipcMain.handle('categories:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.categories).values(data).returning();
        return inserted;
    });
}
