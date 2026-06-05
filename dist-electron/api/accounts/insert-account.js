"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertAccount = registerInsertAccount;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /accounts
 * Cria uma nova conta.
 */
function registerInsertAccount() {
    electron_1.ipcMain.handle('accounts:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.accounts).values(data).returning();
        return inserted;
    });
}
