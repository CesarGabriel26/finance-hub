"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetAssets = registerGetAssets;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * GET /assets
 * Lista todos os ativos cadastrados.
 */
function registerGetAssets() {
    electron_1.ipcMain.handle('assets:get-all', async () => {
        return db_1.db.select().from(schemas_1.assets);
    });
}
