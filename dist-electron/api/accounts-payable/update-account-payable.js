"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateAccountPayable = registerUpdateAccountPayable;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerUpdateAccountPayable() {
    electron_1.ipcMain.handle('accounts-payable:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.accountsPayable)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schemas_1.accountsPayable.id, id))
            .returning();
        return updated ?? null;
    });
}
