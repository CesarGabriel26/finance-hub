"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDueNotifications = checkDueNotifications;
exports.registerNotificationHandlers = registerNotificationHandlers;
exports.startDueNotificationsScheduler = startDueNotificationsScheduler;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schemas_1 = require("../db/schemas");
const DEFAULT_DAYS_AHEAD = 3;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const notifiedKeys = new Set();
let scheduler = null;
function todayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function addDaysIso(days) {
    const now = new Date();
    now.setDate(now.getDate() + days);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function plural(count, singular, pluralText) {
    return count === 1 ? `1 ${singular}` : `${count} ${pluralText}`;
}
async function checkDueNotifications(options = {}) {
    const daysAhead = Math.max(0, options.daysAhead ?? DEFAULT_DAYS_AHEAD);
    const today = todayIso();
    const dueUntil = addDaysIso(daysAhead);
    const [payables, receivables] = await Promise.all([
        db_1.db
            .select()
            .from(schemas_1.accountsPayable)
            .where((0, drizzle_orm_1.inArray)(schemas_1.accountsPayable.status, ['pending', 'overdue']))
            .orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsPayable.dueDate)),
        db_1.db
            .select()
            .from(schemas_1.accountsReceivable)
            .where((0, drizzle_orm_1.inArray)(schemas_1.accountsReceivable.status, ['pending', 'overdue']))
            .orderBy((0, drizzle_orm_1.asc)(schemas_1.accountsReceivable.dueDate)),
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
    const result = {
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
    if (!electron_1.Notification.isSupported()) {
        return result;
    }
    if (process.platform === 'win32') {
        electron_1.app.setAppUserModelId('finance-hub');
    }
    const summary = [
        duePayables.length > 0 ? plural(duePayables.length, 'conta a pagar', 'contas a pagar') : '',
        dueReceivables.length > 0 ? plural(dueReceivables.length, 'conta a receber', 'contas a receber') : '',
    ].filter(Boolean).join(' e ');
    const overdueText = overdueCount > 0
        ? ` ${plural(overdueCount, 'item ja esta vencido', 'itens ja estao vencidos')}.`
        : '';
    new electron_1.Notification({
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
function registerNotificationHandlers() {
    electron_1.ipcMain.handle('notifications:check-due', async (_, options) => checkDueNotifications(options));
}
function startDueNotificationsScheduler() {
    if (scheduler)
        return;
    setTimeout(() => {
        void checkDueNotifications();
    }, 15000);
    scheduler = setInterval(() => {
        void checkDueNotifications();
    }, CHECK_INTERVAL_MS);
    scheduler.unref?.();
}
