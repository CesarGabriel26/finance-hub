"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertAsset = registerInsertAsset;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /assets
 * Cadastra um novo ativo (ação, FII, CDB, etc.).
 */
function registerInsertAsset() {
    electron_1.ipcMain.handle('assets:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.assets).values(data).returning();
        return inserted;
    });
}
