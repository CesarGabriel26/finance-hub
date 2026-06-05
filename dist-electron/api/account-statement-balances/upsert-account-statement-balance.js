"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUpsertAccountStatementBalance = registerUpsertAccountStatementBalance;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const schemas_1 = require("../../db/schemas");
function registerUpsertAccountStatementBalance() {
    electron_1.ipcMain.handle('account-statement-balances:upsert', async (_, data) => {
        const now = new Date().toISOString();
        const [existing] = await db_1.db
            .select()
            .from(schemas_1.accountStatementBalances)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schemas_1.accountStatementBalances.accountId, data.accountId), (0, drizzle_orm_1.eq)(schemas_1.accountStatementBalances.period, data.period)))
            .limit(1);
        if (existing) {
            const { id: _id, createdAt: _createdAt, ...updateData } = data;
            const [updated] = await db_1.db
                .update(schemas_1.accountStatementBalances)
                .set({
                ...updateData,
                updatedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(schemas_1.accountStatementBalances.id, existing.id))
                .returning();
            return updated;
        }
        const [inserted] = await db_1.db
            .insert(schemas_1.accountStatementBalances)
            .values({
            ...data,
            importedAt: data.importedAt ?? now,
        })
            .returning();
        return inserted;
    });
}
