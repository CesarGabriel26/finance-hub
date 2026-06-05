import { ipcMain } from 'electron';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { monthlyClosings } from '../db/schemas';
import type { NewMonthlyClosing } from '../../src/app/models/monthly-closing.model';

export function registerMonthlyClosingHandlers(): void {
  ipcMain.handle('monthly-closings:get-all', async () => {
    return db.select().from(monthlyClosings).orderBy(desc(monthlyClosings.period));
  });

  ipcMain.handle('monthly-closings:upsert', async (_, data: NewMonthlyClosing) => {
    const now = new Date().toISOString();
    const [existing] = await db
      .select()
      .from(monthlyClosings)
      .where(eq(monthlyClosings.period, data.period))
      .limit(1);

    if (existing) {
      const { id: _id, createdAt: _createdAt, ...updateData } = data;
      const [updated] = await db
        .update(monthlyClosings)
        .set({
          ...updateData,
          updatedAt: now,
          closedAt: data.closedAt ?? now,
        })
        .where(eq(monthlyClosings.id, existing.id))
        .returning();

      return updated;
    }

    const [inserted] = await db
      .insert(monthlyClosings)
      .values({
        ...data,
        closedAt: data.closedAt ?? now,
      })
      .returning();

    return inserted;
  });
}
