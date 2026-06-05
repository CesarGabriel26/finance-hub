"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertCategoryRule = registerInsertCategoryRule;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerInsertCategoryRule() {
    electron_1.ipcMain.handle('category-rules:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.categoryRules).values(data).returning();
        return inserted;
    });
}
