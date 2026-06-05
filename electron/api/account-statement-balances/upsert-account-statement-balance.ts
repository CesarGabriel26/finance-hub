import { ipcMain } from 'electron';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { accountStatementBalances } from '../../db/schemas';
import type { NewAccountStatementBalance } from '../../../src/app/models/account-statement-balance.model';

export function registerUpsertAccountStatementBalance(): void {
  ipcMain.handle(
    'account-statement-balances:upsert',
    async (_, data: NewAccountStatementBalance) => {
      const now = new Date().toISOString();
      const [existing] = await db
        .select()
        .from(accountStatementBalances)
        .where(
          and(
            eq(accountStatementBalances.accountId, data.accountId),
            eq(accountStatementBalances.period, data.period),
          ),
        )
        .limit(1);

      if (existing) {
        const { id: _id, createdAt: _createdAt, ...updateData } = data;

        const [updated] = await db
          .update(accountStatementBalances)
          .set({
            ...updateData,
            updatedAt: now,
          })
          .where(eq(accountStatementBalances.id, existing.id))
          .returning();

        return updated;
      }

      const [inserted] = await db
        .insert(accountStatementBalances)
        .values({
          ...data,
          importedAt: data.importedAt ?? now,
        })
        .returning();

      return inserted;
    },
  );
}
