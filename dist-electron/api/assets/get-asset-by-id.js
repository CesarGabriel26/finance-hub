"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAssetById = registerGetAssetById;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * GET /assets/:id
 * Retorna um ativo pelo ID.
 */
function registerGetAssetById() {
    electron_1.ipcMain.handle('assets:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.assets)
            .where((0, drizzle_orm_1.eq)(schemas_1.assets.id, id))
            .limit(1);
        return row ?? null;
    });
}
