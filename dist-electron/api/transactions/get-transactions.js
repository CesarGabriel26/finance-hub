"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetTransactions = registerGetTransactions;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
const filters_1 = require("../../utils/filters");
/**
 * GET /transactions?accountId=:id
 * Lista todas as transações de uma conta, ordenadas por data decrescente.
 */
function registerGetTransactions() {
    electron_1.ipcMain.handle('transactions:get-all', async (_, query) => {
        if (typeof query === 'string' && query) {
            return db_1.db
                .select()
                .from(schemas_1.transactions)
                .where((0, drizzle_orm_1.eq)(schemas_1.transactions.accountId, query))
                .orderBy((0, drizzle_orm_1.desc)(schemas_1.transactions.date));
        }
        const filter = typeof query === 'object' && query
            ? (0, filters_1.buildTableFilter)(schemas_1.transactions, query)
            : undefined;
        if (filter) {
            return db_1.db
                .select()
                .from(schemas_1.transactions)
                .where(filter)
                .orderBy((0, drizzle_orm_1.desc)(schemas_1.transactions.date));
        }
        return db_1.db.select().from(schemas_1.transactions).orderBy((0, drizzle_orm_1.desc)(schemas_1.transactions.date));
    });
}
