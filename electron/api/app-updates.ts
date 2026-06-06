import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

export interface UpdateCheckResult {
  enabled: boolean;
  status: 'disabled' | 'checking' | 'available' | 'not-available' | 'error';
  version: string;
  message: string;
}

export function configureAutoUpdates(): void {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(error => {
      console.warn('[Updates] Falha ao verificar atualizacoes:', error);
    });
  }, 10_000);
}

export function registerAppUpdateHandlers(): void {
  ipcMain.handle('updates:check', async (): Promise<UpdateCheckResult> => {
    if (!app.isPackaged) {
      return {
        enabled: false,
        status: 'disabled',
        version: app.getVersion(),
        message: 'Auto update roda apenas no aplicativo empacotado.',
      };
    }

    try {
      const result = await autoUpdater.checkForUpdates();

      return {
        enabled: true,
        status: result?.updateInfo?.version ? 'available' : 'not-available',
        version: result?.updateInfo?.version ?? app.getVersion(),
        message: result?.updateInfo?.version
          ? `Versao ${result.updateInfo.version} encontrada.`
          : 'Nenhuma atualizacao encontrada.',
      };
    } catch (error) {
      return {
        enabled: true,
        status: 'error',
        version: app.getVersion(),
        message: error instanceof Error ? error.message : 'Falha ao verificar atualizacoes.',
      };
    }
  });
}
