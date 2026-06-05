import { ipcMain } from 'electron';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { accountReconciliations } from '../db/schemas';
import type { NewAccountReconciliation } from '../../src/app/models/account-reconciliation.model';

export function registerAccountReconciliationHandlers(): void {
  ipcMain.handle('account-reconciliations:get-all', async (_, period?: string) => {
    if (period) {
      return db
        .select()
        .from(accountReconciliations)
        .where(eq(accountReconciliations.period, period))
        .orderBy(desc(accountReconciliations.reconciledAt));
    }

    return db
      .select()
      .from(accountReconciliations)
      .orderBy(desc(accountReconciliations.reconciledAt));
  });

  ipcMain.handle('account-reconciliations:upsert', async (_, data: NewAccountReconciliation) => {
    const now = new Date().toISOString();
    const difference = Number(data.difference ?? (data.realBalance - (data.systemBalance ?? 0)));
    const status = data.status ?? (Math.abs(difference) < 0.01 ? 'matched' : 'difference');
    const [existing] = await db
      .select()
      .from(accountReconciliations)
      .where(and(
        eq(accountReconciliations.accountId, data.accountId),
        eq(accountReconciliations.period, data.period),
      ))
      .limit(1);

    if (existing) {
      const { id: _id, createdAt: _createdAt, ...updateData } = data;
      const [updated] = await db
        .update(accountReconciliations)
        .set({
          ...updateData,
          difference,
          status,
          reconciledAt: data.reconciledAt ?? now,
          updatedAt: now,
        })
        .where(eq(accountReconciliations.id, existing.id))
        .returning();

      return updated;
    }

    const [inserted] = await db
      .insert(accountReconciliations)
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
