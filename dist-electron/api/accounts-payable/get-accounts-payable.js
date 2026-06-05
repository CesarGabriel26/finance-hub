"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccountsPayable = registerGetAccountsPayable;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const filters_1 = require("../../utils/filters");
function registerGetAccountsPayable() {
    electron_1.ipcMain.handle('accounts-payable:get-all', async (_, filters) => {
        const filter = filters ? (0, filters_1.buildTableFilter)(schemas_1.accountsPayable, filters) : undefined;
        if (filter) {
            return db_1.db
                .select()
                .from(schemas_1.accountsPayable)
                .where(filter)
                .orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsPayable.dueDate));
        }
        return db_1.db.select().from(schemas_1.accountsPayable).orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsPayable.dueDate));
    });
}
