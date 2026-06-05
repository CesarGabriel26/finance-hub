"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetInvestmentPortfolios = registerGetInvestmentPortfolios;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetInvestmentPortfolios() {
    electron_1.ipcMain.handle('investment-portfolios:get-all', async () => {
        return db_1.db.select().from(schemas_1.investmentPortfolios).orderBy((0, drizzle_orm_1.asc)(schemas_1.investmentPortfolios.createdAt));
    });
}
