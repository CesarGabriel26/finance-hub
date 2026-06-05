"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteTransaction = registerDeleteTransaction;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /transactions/:id
 * Remove uma transação pelo ID.
 */
function registerDeleteTransaction() {
    electron_1.ipcMain.handle('transactions:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.transactions)
            .where((0, drizzle_orm_1.eq)(schemas_1.transactions.id, id))
            .returning();
        return deleted ?? null;
    });
}
