"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGetCategoryRules = registerGetCategoryRules;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerGetCategoryRules() {
    electron_1.ipcMain.handle('category-rules:get-all', async () => db_1.db
        .select({
        id: schemas_1.categoryRules.id,
        keyword: schemas_1.categoryRules.keyword,
        categoryId: schemas_1.categoryRules.categoryId,
        priority: schemas_1.categoryRules.priority,
        createdByUser: schemas_1.categoryRules.createdByUser,
        createdAt: schemas_1.categoryRules.createdAt,
        updatedAt: schemas_1.categoryRules.updatedAt,
        categoryName: schemas_1.categories.name,
        categoryType: schemas_1.categories.type,
    })
        .from(schemas_1.categoryRules)
        .leftJoin(schemas_1.categories, (0, drizzle_orm_1.eq)(schemas_1.categoryRules.categoryId, schemas_1.categories.id))
        .orderBy((0, drizzle_orm_1.asc)(schemas_1.categoryRules.keyword)));
}
