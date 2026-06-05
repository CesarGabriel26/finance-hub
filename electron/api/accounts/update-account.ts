import { ipcMain } from 'electron';
import { db } from '../../db';
import { accounts } from '../../db/schemas';
import { eq } from 'drizzle-orm';
import type { NewAccount } from '../../../src/app/models/account.model';

/**
 * PUT /accounts/:id
 * Atualiza os dados de uma conta.
 */
export function registerUpdateAccount() {
  ipcMain.handle(
    'accounts:update',
    async (_, id: string, data: Partial<NewAccount>) => {
      const [updated] = await db
        .update(accounts)
        .set(data)
        .where(eq(accounts.id, id))
        .returning();

      return updated ?? null;
    },
  );
}
