"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertAccountReceivable = registerInsertAccountReceivable;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerInsertAccountReceivable() {
    electron_1.ipcMain.handle('accounts-receivable:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.accountsReceivable).values(data).returning();
        return inserted;
    });
}
