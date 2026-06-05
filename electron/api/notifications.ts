import { Notification, app, ipcMain } from 'electron';
import { asc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { accountsPayable, accountsReceivable } from '../db/schemas';

interface DueNotificationOptions {
  daysAhead?: number;
  force?: boolean;
}

interface DueNotificationResult {
  notified: boolean;
  payablesCount: number;
  receivablesCount: number;
  overdueCount: number;
  dueUntil: string;
}

const DEFAULT_DAYS_AHEAD = 3;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const notifiedKeys = new Set<string>();
let scheduler: NodeJS.Timeout | null = null;

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDaysIso(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function plural(count: number, singular: string, pluralText: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${pluralText}`;
}

export async function checkDueNotifications(
  options: DueNotificationOptions = {},
): Promise<DueNotificationResult> {
  const daysAhead = Math.max(0, options.daysAhead ?? DEFAULT_DAYS_AHEAD);
  const today = todayIso();
  const dueUntil = addDaysIso(daysAhead);

  const [payables, receivables] = await Promise.all([
    db
      .select()
      .from(accountsPayable)
      .where(inArray(accountsPayable.status, ['pending', 'overdue']))
      .orderBy(asc(accountsPayable.dueDate)),
    db
      .select()
      .from(accountsReceivable)
      .where(inArray(accountsReceivable.status, ['pending', 'overdue']))
      .orderBy(asc(accountsReceivable.dueDate)),
  ]);

  const duePayables = payables.filter(item => item.dueDate.slice(0, 10) <= dueUntil);
  const dueReceivables = receivables.filter(item => item.dueDate.slice(0, 10) <= dueUntil);
  const overdueCount = [...duePayables, ...dueReceivables]
    .filter(item => item.dueDate.slice(0, 10) < today || item.status === 'overdue')
    .length;
  const itemIds = [...duePayables, ...dueReceivables]
    .map(item => item.id)
    .sort()
    .join('|');
  const notificationKey = `${today}:${daysAhead}:${itemIds}`;

  const result: DueNotificationResult = {
    notified: false,
    payablesCount: duePayables.length,
    receivablesCount: dueReceivables.length,
    overdueCount,
    dueUntil,
  };

  if (duePayables.length === 0 && dueReceivables.length === 0) {
    return result;
  }

  if (!options.force && notifiedKeys.has(notificationKey)) {
    return result;
  }

  if (!Notification.isSupported()) {
    return result;
  }

  if (process.platform === 'win32') {
    app.setAppUserModelId('finance-hub');
  }

  const summary = [
    duePayables.length > 0 ? plural(duePayables.length, 'conta a pagar', 'contas a pagar') : '',
    dueReceivables.length > 0 ? plural(dueReceivables.length, 'conta a receber', 'contas a receber') : '',
  ].filter(Boolean).join(' e ');
  const overdueText = overdueCount > 0
    ? ` ${plural(overdueCount, 'item ja esta vencido', 'itens ja estao vencidos')}.`
    : '';

  new Notification({
    title: 'Vencimentos proximos',
    body: `${summary} vencem ate ${dueUntil}.${overdueText}`,
    silent: false,
  }).show();

  notifiedKeys.add(notificationKey);
  return {
    ...result,
    notified: true,
  };
}

export function registerNotificationHandlers(): void {
  ipcMain.handle('notifications:check-due', async (_, options?: DueNotificationOptions) =>
    checkDueNotifications(options),
  );
}

export function startDueNotificationsScheduler(): void {
  if (scheduler) return;

  setTimeout(() => {
    void checkDueNotifications();
  }, 15_000);

  scheduler = setInterval(() => {
    void checkDueNotifications();
  }, CHECK_INTERVAL_MS);
  scheduler.unref?.();
}
