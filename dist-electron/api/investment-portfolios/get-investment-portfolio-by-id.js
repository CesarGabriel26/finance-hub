"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetInvestmentPortfolioById = registerGetInvestmentPortfolioById;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetInvestmentPortfolioById() {
    electron_1.ipcMain.handle('investment-portfolios:get-by-id', async (_, id) => {
        const [row] = await db_1.db
            .select()
            .from(schemas_1.investmentPortfolios)
            .where((0, drizzle_orm_1.eq)(schemas_1.investmentPortfolios.id, id))
            .limit(1);
        return row ?? null;
    });
}
