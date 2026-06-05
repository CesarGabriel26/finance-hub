import { app, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { checkpointDatabase, closeDatabase, dbPath } from '../db';

export interface BackupResult {
  ok: boolean;
  path?: string;
  restartScheduled?: boolean;
  message: string;
}

export function registerMaintenanceHandlers(): void {
  ipcMain.handle('maintenance:backup', async (): Promise<BackupResult> => {
    const defaultName = `financehub-backup-${new Date().toISOString().slice(0, 10)}.db`;
    const result = await dialog.showSaveDialog({
      title: 'Salvar backup do Finance Hub',
      defaultPath: defaultName,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, message: 'Backup cancelado.' };
    }

    checkpointDatabase();
    fs.copyFileSync(dbPath, result.filePath);

    return {
      ok: true,
      path: result.filePath,
      message: 'Backup salvo com sucesso.',
    };
  });

  ipcMain.handle('maintenance:restore', async (): Promise<BackupResult> => {
    const result = await dialog.showOpenDialog({
      title: 'Restaurar backup do Finance Hub',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, message: 'Restauracao cancelada.' };
    }

    const sourcePath = result.filePaths[0];
    const safetyCopy = `${dbPath}.before-restore-${Date.now()}`;
    fs.copyFileSync(dbPath, safetyCopy);

    closeDatabase();
    fs.copyFileSync(sourcePath, dbPath);
    removeIfExists(`${dbPath}-wal`);
    removeIfExists(`${dbPath}-shm`);

    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 250);

    return {
      ok: true,
      path: sourcePath,
      restartScheduled: true,
      message: `Backup restaurado. Copia de seguranca criada em ${path.basename(safetyCopy)}.`,
    };
  });
}

function removeIfExists(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}
