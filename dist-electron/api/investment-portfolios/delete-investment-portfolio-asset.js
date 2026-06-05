"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeleteInvestmentPortfolioAsset = registerDeleteInvestmentPortfolioAsset;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerDeleteInvestmentPortfolioAsset() {
    electron_1.ipcMain.handle('investment-portfolios:delete-asset', async (_, id) => {
        const [deleted] = await db_1.db
            .delete(schemas_1.investmentPortfolioAssets)
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentPortfolioAssets.id, id))
            .returning();
        return deleted ?? null;
    });
}
