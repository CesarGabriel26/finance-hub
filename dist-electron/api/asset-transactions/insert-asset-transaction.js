"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertAssetTransaction = registerInsertAssetTransaction;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /asset-transactions
 * Registra uma compra, venda, dividendo ou juros de um ativo.
 */
function registerInsertAssetTransaction() {
    electron_1.ipcMain.handle('asset-transactions:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.assetTransactions).values(data).returning();
        return inserted;
    });
}
