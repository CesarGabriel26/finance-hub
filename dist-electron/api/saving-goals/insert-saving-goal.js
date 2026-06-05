"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertSavingGoal = registerInsertSavingGoal;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /saving-goals
 * Cria uma nova meta de poupança.
 */
function registerInsertSavingGoal() {
    electron_1.ipcMain.handle('saving-goals:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.savingGoals).values(data).returning();
        return inserted;
    });
}
