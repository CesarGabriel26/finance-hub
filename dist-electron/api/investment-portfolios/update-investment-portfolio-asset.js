"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpdateInvestmentPortfolioAsset = registerUpdateInvestmentPortfolioAsset;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
const investment_asset_snapshots_1 = require("./investment-asset-snapshots");
function registerUpdateInvestmentPortfolioAsset() {
    electron_1.ipcMain.handle('investment-portfolios:update-asset', async (_, id, data) => {
        const [updated] = await db_1.db
            .update(schemas_1.investmentPortfolioAssets)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentPortfolioAssets.id, id))
            .returning();
        if (updated) {
            await (0, investment_asset_snapshots_1.upsertInvestmentAssetSnapshot)((0, investment_asset_snapshots_1.buildAssetSnapshot)(updated));
        }
        return updated ?? null;
    });
}
