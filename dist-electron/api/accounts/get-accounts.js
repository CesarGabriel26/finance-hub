"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccounts = registerGetAccounts;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const filters_1 = require("../../utils/filters");
/**
 * GET /accounts
 * Lista todas as contas.
 */
function registerGetAccounts() {
    electron_1.ipcMain.handle('accounts:get-all', async (_, filters) => {
        if (filters) {
            const filter = (0, filters_1.buildTableFilter)(schemas_1.accounts, filters);
            return db_1.db.select().from(schemas_1.accounts).where(filter);
        }
        return db_1.db.select().from(schemas_1.accounts);
    });
}
