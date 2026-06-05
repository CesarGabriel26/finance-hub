"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteCategoryRule = registerDeleteCategoryRule;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerDeleteCategoryRule() {
    electron_1.ipcMain.handle('category-rules:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.categoryRules)
            .where((0, drizzle_orm_1.eq)(schemas_1.categoryRules.id, id))
            .returning();
        return deleted ?? null;
    });
}
