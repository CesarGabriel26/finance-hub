"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccountReceivableById = registerGetAccountReceivableById;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetAccountReceivableById() {
    electron_1.ipcMain.handle('accounts-receivable:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.accountsReceivable)
            .where((0, drizzle_orm_1.eq)(schemas_1.accountsReceivable.id, id))
            .limit(1);
        return row ?? null;
    });
}
