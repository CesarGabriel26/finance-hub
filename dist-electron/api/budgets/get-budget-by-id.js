"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetBudgetById = registerGetBudgetById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /budgets/:id
 * Retorna um orçamento pelo ID.
 */
function registerGetBudgetById() {
    electron_1.ipcMain.handle('budgets:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.budgets)
            .where((0, drizzle_orm_1.eq)(schemas_1.budgets.id, id))
            .limit(1);
        return row ?? null;
    });
}
