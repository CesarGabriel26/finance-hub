"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteBudget = registerDeleteBudget;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /budgets/:id
 * Remove um orçamento pelo ID.
 */
function registerDeleteBudget() {
    electron_1.ipcMain.handle('budgets:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.budgets)
            .where((0, drizzle_orm_1.eq)(schemas_1.budgets.id, id))
            .returning();
        return deleted ?? null;
    });
}
