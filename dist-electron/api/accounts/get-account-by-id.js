"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAccountById = registerGetAccountById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /accounts/:id
 * Retorna uma conta pelo ID.
 */
function registerGetAccountById() {
    electron_1.ipcMain.handle('accounts:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.accounts)
            .where((0, drizzle_orm_1.eq)(schemas_1.accounts.id, id))
            .limit(1);
        return row ?? null;
    });
}
