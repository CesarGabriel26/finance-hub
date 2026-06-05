"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertAccountPayable = registerInsertAccountPayable;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerInsertAccountPayable() {
    electron_1.ipcMain.handle('accounts-payable:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.accountsPayable).values(data).returning();
        return inserted;
    });
}
