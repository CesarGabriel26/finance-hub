"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertBudget = registerInsertBudget;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
/**
 * POST /budgets
 * Cria um teto de orçamento para uma categoria em um mês/ano.
 * A constraint única (categoryId + month + year) impede duplicatas.
 */
function registerInsertBudget() {
    electron_1.ipcMain.handle('budgets:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.budgets).values(data).returning();
        return inserted;
    });
}
