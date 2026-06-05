"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteAccountPayable = registerDeleteAccountPayable;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerDeleteAccountPayable() {
    electron_1.ipcMain.handle('accounts-payable:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.accountsPayable)
            .where((0, drizzle_orm_1.eq)(schemas_1.accountsPayable.id, id))
            .returning();
        return deleted ?? null;
    });
}
