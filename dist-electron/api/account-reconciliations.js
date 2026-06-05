"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAccountReconciliationHandlers = registerAccountReconciliationHandlers;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schemas_1 = require("../db/schemas");
function registerAccountReconciliationHandlers() {
    electron_1.ipcMain.handle('account-reconciliations:get-all', async (_, period) => {
        if (period) {
            return db_1.db
                .select()
                .from(schemas_1.accountReconciliations)
                .where((0, drizzle_orm_1.eq)(schemas_1.accountReconciliations.period, period))
                .orderBy((0, drizzle_orm_1.desc)(schemas_1.accountReconciliations.reconciledAt));
        }
        return db_1.db
            .select()
            .from(schemas_1.accountReconciliations)
            .orderBy((0, drizzle_orm_1.desc)(schemas_1.accountReconciliations.reconciledAt));
    });
    electron_1.ipcMain.handle('account-reconciliations:upsert', async (_, data) => {
        const now = new Date().toISOString();
        const difference = Number(data.difference ?? (data.realBalance - (data.systemBalance ?? 0)));
        const status = data.status ?? (Math.abs(difference) < 0.01 ? 'matched' : 'difference');
        const [existing] = await db_1.db
            .select()
            .from(schemas_1.accountReconciliations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schemas_1.accountReconciliations.accountId, data.accountId), (0, drizzle_orm_1.eq)(schemas_1.accountReconciliations.period, data.period)))
            .limit(1);
        if (existing) {
            const { id: _id, createdAt: _createdAt, ...updateData } = data;
            const [updated] = await db_1.db
                .update(schemas_1.accountReconciliations)
                .set({
                ...updateData,
                difference,
                status,
                reconciledAt: data.reconciledAt ?? now,
                updatedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(schemas_1.accountReconciliations.id, existing.id))
                .returning();
            return updated;
        }
        const [inserted] = await db_1.db
            .insert(schemas_1.accountReconciliations)
            .values({
            ...data,
            difference,
            status,
            reconciledAt: data.reconciledAt ?? now,
        })
            .returning();
        return inserted;
    });
}
