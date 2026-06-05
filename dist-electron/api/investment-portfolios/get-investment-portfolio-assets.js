"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetInvestmentPortfolioAssets = registerGetInvestmentPortfolioAssets;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetInvestmentPortfolioAssets() {
    electron_1.ipcMain.handle('investment-portfolios:get-assets', async (_, portfolioId) => {
        return db_1.db
            .select()
            .from(schemas_1.investmentPortfolioAssets)
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentPortfolioAssets.portfolioId, portfolioId))
            .orderBy((0, drizzle_orm_1.asc)(schemas_1.investmentPortfolioAssets.ticker));
    });
}
