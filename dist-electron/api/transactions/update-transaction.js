"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateTransaction = registerUpdateTransaction;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /transactions/:id
 * Atualiza os dados de uma transação existente.
 */
function registerUpdateTransaction() {
    electron_1.ipcMain.handle('transactions:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.transactions)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.transactions.id, id))
            .returning();
        return updated ?? null;
    });
}
