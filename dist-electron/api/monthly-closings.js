"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMonthlyClosingHandlers = registerMonthlyClosingHandlers;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schemas_1 = require("../db/schemas");
function registerMonthlyClosingHandlers() {
    electron_1.ipcMain.handle('monthly-closings:get-all', async () => {
        return db_1.db.select().from(schemas_1.monthlyClosings).orderBy((0, drizzle_orm_1.desc)(schemas_1.monthlyClosings.period));
    });
    electron_1.ipcMain.handle('monthly-closings:upsert', async (_, data) => {
        const now = new Date().toISOString();
        const [existing] = await db_1.db
            .select()
            .from(schemas_1.monthlyClosings)
            .where((0, drizzle_orm_1.eq)(schemas_1.monthlyClosings.period, data.period))
            .limit(1);
        if (existing) {
            const { id: _id, createdAt: _createdAt, ...updateData } = data;
            const [updated] = await db_1.db
                .update(schemas_1.monthlyClosings)
                .set({
                ...updateData,
                updatedAt: now,
                closedAt: data.closedAt ?? now,
            })
                .where((0, drizzle_orm_1.eq)(schemas_1.monthlyClosings.id, existing.id))
                .returning();
            return updated;
        }
        const [inserted] = await db_1.db
            .insert(schemas_1.monthlyClosings)
            .values({
            ...data,
            closedAt: data.closedAt ?? now,
        })
            .returning();
        return inserted;
    });
}
