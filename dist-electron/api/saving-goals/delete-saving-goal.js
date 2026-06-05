"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteSavingGoal = registerDeleteSavingGoal;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /saving-goals/:id
 * Remove uma meta de poupança pelo ID.
 */
function registerDeleteSavingGoal() {
    electron_1.ipcMain.handle('saving-goals:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.savingGoals)
            .where((0, drizzle_orm_1.eq)(schemas_1.savingGoals.id, id))
            .returning();
        return deleted ?? null;
    });
}
