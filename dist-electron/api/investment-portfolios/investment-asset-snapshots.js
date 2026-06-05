"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssetSnapshot = buildAssetSnapshot;
exports.upsertInvestmentAssetSnapshot = upsertInvestmentAssetSnapshot;
exports.registerGetInvestmentAssetSnapshots = registerGetInvestmentAssetSnapshots;
exports.registerInsertInvestmentAssetSnapshot = registerInsertInvestmentAssetSnapshot;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function buildAssetSnapshot(asset, snapshotDate = new Date().toISOString().slice(0, 10)) {
    const fixedIncome = ['cdb', 'lci_lca', 'treasury'].includes(asset.type);
    const investedAmount = amountOrFallback(fixedIncome ? asset.fixedIncomeInvestedAmount : null, asset.quantity * asset.averagePrice);
    const grossAmount = amountOrFallback(fixedIncome ? asset.fixedIncomeGrossAmount : null, asset.quantity * asset.currentPrice);
    const netAmount = amountOrFallback(fixedIncome ? asset.fixedIncomeNetAmount : null, grossAmount);
    return {
        assetId: asset.id,
        portfolioId: asset.portfolioId,
        snapshotDate,
        investedAmount,
        grossAmount,
        netAmount,
        resultAmount: grossAmount - investedAmount,
        quantity: asset.quantity,
        currentPrice: asset.currentPrice,
        notes: 'Snapshot automatico',
    };
}
async function upsertInvestmentAssetSnapshot(data) {
    const [existing] = await db_1.db
        .select()
        .from(schemas_1.investmentAssetSnapshots)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schemas_1.investmentAssetSnapshots.assetId, data.assetId), (0, drizzle_orm_1.eq)(schemas_1.investmentAssetSnapshots.snapshotDate, data.snapshotDate)))
        .limit(1);
    if (existing) {
        const [updated] = await db_1.db
            .update(schemas_1.investmentAssetSnapshots)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentAssetSnapshots.id, existing.id))
            .returning();
        return updated;
    }
    const [inserted] = await db_1.db.insert(schemas_1.investmentAssetSnapshots).values(data).returning();
    return inserted;
}
function registerGetInvestmentAssetSnapshots() {
    electron_1.ipcMain.handle('investment-portfolios:get-asset-snapshots', async (_, portfolioId) => {
        return db_1.db
            .select()
            .from(schemas_1.investmentAssetSnapshots)
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentAssetSnapshots.portfolioId, portfolioId))
            .orderBy((0, drizzle_orm_1.desc)(schemas_1.investmentAssetSnapshots.snapshotDate));
    });
}
function registerInsertInvestmentAssetSnapshot() {
    electron_1.ipcMain.handle('investment-portfolios:insert-asset-snapshot', async (_, data) => upsertInvestmentAssetSnapshot(data));
}
function amountOrFallback(value, fallback) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : fallback;
}
