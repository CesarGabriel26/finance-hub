"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateSavingGoal = registerUpdateSavingGoal;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /saving-goals/:id
 * Atualiza os dados de uma meta (ex: incrementar currentAmount após um depósito).
 */
function registerUpdateSavingGoal() {
    electron_1.ipcMain.handle('saving-goals:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.savingGoals)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.savingGoals.id, id))
            .returning();
        return updated ?? null;
    });
}
