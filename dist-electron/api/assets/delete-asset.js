"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteAsset = registerDeleteAsset;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * DELETE /assets/:id
 * Remove um ativo. Transações vinculadas serão removidas em cascata.
 */
function registerDeleteAsset() {
    electron_1.ipcMain.handle('assets:delete', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.assets)
            .where((0, drizzle_orm_1.eq)(schemas_1.assets.id, id))
            .returning();
        return deleted ?? null;
    });
}
