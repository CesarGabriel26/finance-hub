"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetBudgets = registerGetBudgets;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /budgets?month=:month&year=:year
 * Lista os orçamentos de um período específico.
 */
function registerGetBudgets() {
    electron_1.ipcMain.handle('budgets:get-all', async (_, month, year) => {
        return db_1.db
            .select()
            .from(schemas_1.budgets)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schemas_1.budgets.periodMonth, month), (0, drizzle_orm_1.eq)(schemas_1.budgets.periodYear, year)));
    });
}
