"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateAssetTransaction = registerUpdateAssetTransaction;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /asset-transactions/:id
 * Corrige os dados de uma movimentação de ativo.
 */
function registerUpdateAssetTransaction() {
    electron_1.ipcMain.handle('asset-transactions:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.assetTransactions)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.assetTransactions.id, id))
            .returning();
        return updated ?? null;
    });
}
