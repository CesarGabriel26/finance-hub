"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAssetTransactions = registerGetAssetTransactions;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /asset-transactions?assetId=:id
 * Lista todas as movimentações de um ativo, ordenadas por data decrescente.
 */
function registerGetAssetTransactions() {
    electron_1.ipcMain.handle('asset-transactions:get-all', async (_, assetId) => {
        return db_1.db
            .select()
            .from(schemas_1.assetTransactions)
            .where((0, drizzle_orm_1.eq)(schemas_1.assetTransactions.assetId, assetId))
            .orderBy((0, drizzle_orm_1.desc)(schemas_1.assetTransactions.date));
    });
}
