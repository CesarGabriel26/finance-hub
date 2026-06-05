"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateBudget = registerUpdateBudget;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /budgets/:id
 * Atualiza o teto de orçamento de uma categoria.
 */
function registerUpdateBudget() {
    electron_1.ipcMain.handle('budgets:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.budgets)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.budgets.id, id))
            .returning();
        return updated ?? null;
    });
}
