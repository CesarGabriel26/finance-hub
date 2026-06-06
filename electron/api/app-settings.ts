import { app, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { checkpointDatabase, dbPath } from '../db';

export type AppTheme = 'light' | 'dark';
export type ExperienceMode = 'beginner' | 'advanced';
export type AutoBackupFrequency = 'daily' | 'weekly';
export type AiCategorizationProvider = 'openai' | 'gemini';

export interface AppSettings {
  autoBackupEnabled: boolean;
  autoBackupDirectory: string;
  autoBackupFrequency: AutoBackupFrequency;
  lastAutoBackupAt: string | null;
  startWithWindows: boolean;
  dueNotificationsEnabled: boolean;
  dueNotificationDaysAhead: number;
  theme: AppTheme;
  defaultCurrency: string;
  experienceMode: ExperienceMode;
  aiCategorizationEnabled: boolean;
  aiCategorizationProvider: AiCategorizationProvider;
  openAiApiKey: string;
  openAiModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
let scheduler: NodeJS.Timeout | null = null;

const defaultSettings: AppSettings = {
  autoBackupEnabled: false,
  autoBackupDirectory: '',
  autoBackupFrequency: 'daily',
  lastAutoBackupAt: null,
  startWithWindows: false,
  dueNotificationsEnabled: true,
  dueNotificationDaysAhead: 3,
  theme: 'light',
  defaultCurrency: 'BRL',
  experienceMode: 'beginner',
  aiCategorizationEnabled: false,
  aiCategorizationProvider: 'openai',
  openAiApiKey: '',
  openAiModel: 'gpt-5.4-nano',
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash',
};

export function getAppSettings(): AppSettings {
  const stored = readSettingsFile();
  const loginSettings = app.getLoginItemSettings();

  return {
    ...defaultSettings,
    ...stored,
    startWithWindows: loginSettings.openAtLogin,
  };
}

export function updateAppSettings(update: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const next: AppSettings = {
    ...current,
    ...update,
    dueNotificationDaysAhead: Math.max(0, Number(update.dueNotificationDaysAhead ?? current.dueNotificationDaysAhead) || 0),
  };

  app.setLoginItemSettings({
    openAtLogin: next.startWithWindows,
    openAsHidden: false,
  });

  writeSettingsFile(next);
  restartAutomaticBackupScheduler();

  return getAppSettings();
}

export function registerAppSettingsHandlers(): void {
  ipcMain.handle('app-settings:get', async () => getAppSettings());
  ipcMain.handle('app-settings:update', async (_, update: Partial<AppSettings>) => updateAppSettings(update));
  ipcMain.handle('app-settings:select-auto-backup-directory', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecionar pasta para backups automaticos',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return getAppSettings();
    }

    return updateAppSettings({ autoBackupDirectory: result.filePaths[0] });
  });
  ipcMain.handle('app-settings:run-auto-backup-now', async () => {
    const filePath = runAutomaticBackup('manual');
    return {
      ok: Boolean(filePath),
      path: filePath,
      settings: getAppSettings(),
    };
  });
}

export function startAutomaticBackupScheduler(): void {
  if (scheduler) return;

  setTimeout(() => {
    runAutomaticBackupIfDue();
  }, 30_000);

  scheduler = setInterval(() => {
    runAutomaticBackupIfDue();
  }, CHECK_INTERVAL_MS);
  scheduler.unref?.();
}

function restartAutomaticBackupScheduler(): void {
  if (scheduler) {
    clearInterval(scheduler);
    scheduler = null;
  }
  startAutomaticBackupScheduler();
}

function runAutomaticBackupIfDue(): void {
  const settings = getAppSettings();
  if (!settings.autoBackupEnabled || !settings.autoBackupDirectory) return;

  const last = settings.lastAutoBackupAt ? new Date(settings.lastAutoBackupAt) : null;
  const now = new Date();
  const intervalMs = settings.autoBackupFrequency === 'weekly'
    ? 7 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;

  if (!last || now.getTime() - last.getTime() >= intervalMs) {
    runAutomaticBackup('scheduled');
  }
}

function runAutomaticBackup(reason: 'manual' | 'scheduled'): string | null {
  const settings = getAppSettings();
  if (!settings.autoBackupDirectory) return null;

  fs.mkdirSync(settings.autoBackupDirectory, { recursive: true });
  checkpointDatabase();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(settings.autoBackupDirectory, `financehub-${reason}-${timestamp}.db`);
  fs.copyFileSync(dbPath, filePath);
  writeSettingsFile({
    ...settings,
    lastAutoBackupAt: new Date().toISOString(),
  });

  return filePath;
}

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettingsFile(): Partial<AppSettings> {
  try {
    const filePath = settingsPath();
    if (!fs.existsSync(filePath)) return {};

    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<AppSettings>;
  } catch {
    return {};
  }
}

function writeSettingsFile(settings: AppSettings): void {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}
