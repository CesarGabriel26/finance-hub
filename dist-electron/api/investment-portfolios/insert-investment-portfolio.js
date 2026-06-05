"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertInvestmentPortfolio = registerInsertInvestmentPortfolio;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerInsertInvestmentPortfolio() {
    electron_1.ipcMain.handle('investment-portfolios:insert', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.investmentPortfolios).values(data).returning();
        return inserted;
    });
}
