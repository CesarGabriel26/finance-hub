"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateAsset = registerUpdateAsset;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * PUT /assets/:id
 * Atualiza os dados de um ativo.
 */
function registerUpdateAsset() {
    electron_1.ipcMain.handle('assets:update', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.assets)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.assets.id, id))
            .returning();
        return updated ?? null;
    });
}
