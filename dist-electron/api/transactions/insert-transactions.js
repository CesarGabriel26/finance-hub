"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertTransactions = registerInsertTransactions;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /transactions
 * Insere uma ou várias transações em lote (ideal para importação OFX).
 */
function registerInsertTransactions() {
    electron_1.ipcMain.handle('transactions:insert', async (_, data) => {
        const payload = Array.isArray(data) ? data : [data];
        return db_1.db.insert(schemas_1.transactions).values(payload).returning();
    });
}
