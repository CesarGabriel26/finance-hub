"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccountPayableById = registerGetAccountPayableById;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetAccountPayableById() {
    electron_1.ipcMain.handle('accounts-payable:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.accountsPayable)
            .where((0, drizzle_orm_1.eq)(schemas_1.accountsPayable.id, id))
            .limit(1);
        return row ?? null;
    });
}
