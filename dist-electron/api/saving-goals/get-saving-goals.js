"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetSavingGoals = registerGetSavingGoals;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * GET /saving-goals
 * Lista todas as metas de poupança.
 */
function registerGetSavingGoals() {
    electron_1.ipcMain.handle('saving-goals:get-all', async () => {
        return db_1.db.select().from(schemas_1.savingGoals);
    });
}
