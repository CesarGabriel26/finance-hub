"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetTransactionById = registerGetTransactionById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /transactions/:id
 * Retorna uma transação específica pelo ID.
 */
function registerGetTransactionById() {
    electron_1.ipcMain.handle('transactions:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.transactions)
            .where((0, drizzle_orm_1.eq)(schemas_1.transactions.id, id))
            .limit(1);
        return row ?? null;
    });
}
