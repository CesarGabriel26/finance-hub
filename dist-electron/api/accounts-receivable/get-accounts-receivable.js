"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccountsReceivable = registerGetAccountsReceivable;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const filters_1 = require("../../utils/filters");
function registerGetAccountsReceivable() {
    electron_1.ipcMain.handle('accounts-receivable:get-all', async (_, filters) => {
        const filter = filters ? (0, filters_1.buildTableFilter)(schemas_1.accountsReceivable, filters) : undefined;
        if (filter) {
            return db_1.db
                .select()
                .from(schemas_1.accountsReceivable)
                .where(filter)
                .orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsReceivable.dueDate));
        }
        return db_1.db.select().from(schemas_1.accountsReceivable).orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsReceivable.dueDate));
    });
}
