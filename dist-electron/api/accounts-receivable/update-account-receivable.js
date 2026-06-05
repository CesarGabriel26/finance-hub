"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateAccountReceivable = registerUpdateAccountReceivable;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerUpdateAccountReceivable() {
    electron_1.ipcMain.handle('accounts-receivable:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.accountsReceivable)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schemas_1.accountsReceivable.id, id))
            .returning();
        return updated ?? null;
    });
}
