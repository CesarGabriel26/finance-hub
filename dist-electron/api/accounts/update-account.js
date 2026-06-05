"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateAccount = registerUpdateAccount;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /accounts/:id
 * Atualiza os dados de uma conta.
 */
function registerUpdateAccount() {
    electron_1.ipcMain.handle('accounts:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.accounts)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.accounts.id, id))
            .returning();
        return updated ?? null;
    });
}
