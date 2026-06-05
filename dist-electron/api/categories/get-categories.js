"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetCategories = registerGetCategories;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const filters_1 = require("../../utils/filters");
/**
 * GET /categories
 * Lista todas as categorias.
 */
function registerGetCategories() {
    electron_1.ipcMain.handle('categories:get-all', async (_, filters) => {
        if (filters) {
            const filter = (0, filters_1.buildTableFilter)(schemas_1.categories, filters);
            return db_1.db.select().from(schemas_1.categories).where(filter);
        }
        return db_1.db.select().from(schemas_1.categories);
    });
}
