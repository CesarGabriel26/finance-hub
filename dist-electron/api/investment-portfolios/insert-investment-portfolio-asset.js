"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInsertInvestmentPortfolioAsset = registerInsertInvestmentPortfolioAsset;
const electron_1 = require("electron");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerInsertInvestmentPortfolioAsset() {
    electron_1.ipcMain.handle('investment-portfolios:insert-asset', async (_, data) => {
        const [inserted] = await db_1.db.insert(schemas_1.investmentPortfolioAssets).values(data).returning();
        return inserted;
    });
}
