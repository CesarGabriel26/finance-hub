"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetSavingGoalById = registerGetSavingGoalById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /saving-goals/:id
 * Retorna uma meta de poupança pelo ID.
 */
function registerGetSavingGoalById() {
    electron_1.ipcMain.handle('saving-goals:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.savingGoals)
            .where((0, drizzle_orm_1.eq)(schemas_1.savingGoals.id, id))
            .limit(1);
        return row ?? null;
    });
}
