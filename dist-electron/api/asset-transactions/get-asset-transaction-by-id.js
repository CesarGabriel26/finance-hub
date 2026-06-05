"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAssetTransactionById = registerGetAssetTransactionById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /asset-transactions/:id
 * Retorna uma movimentação de ativo pelo ID.
 */
function registerGetAssetTransactionById() {
    electron_1.ipcMain.handle('asset-transactions:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.assetTransactions)
            .where((0, drizzle_orm_1.eq)(schemas_1.assetTransactions.id, id))
            .limit(1);
        return row ?? null;
    });
}
