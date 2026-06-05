"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteAssetTransaction = registerDeleteAssetTransaction;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /asset-transactions/:id
 * Remove uma movimentação de ativo pelo ID.
 */
function registerDeleteAssetTransaction() {
    electron_1.ipcMain.handle('asset-transactions:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.assetTransactions)
            .where((0, drizzle_orm_1.eq)(schemas_1.assetTransactions.id, id))
            .returning();
        return deleted ?? null;
    });
}
