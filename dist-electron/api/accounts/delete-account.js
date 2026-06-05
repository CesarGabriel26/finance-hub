"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteAccount = registerDeleteAccount;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /accounts/:id
 * Remove uma conta pelo ID.
 * Atenção: transações vinculadas serão removidas em cascata (onDelete: cascade).
 */
function registerDeleteAccount() {
    electron_1.ipcMain.handle('accounts:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.accounts)
            .where((0, drizzle_orm_1.eq)(schemas_1.accounts.id, id))
            .returning();
        return deleted ?? null;
    });
}
