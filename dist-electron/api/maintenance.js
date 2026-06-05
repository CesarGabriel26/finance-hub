"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMaintenanceHandlers = registerMaintenanceHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
function registerMaintenanceHandlers() {
    electron_1.ipcMain.handle('maintenance:backup', async () => {
        const defaultName = `financehub-backup-${new Date().toISOString().slice(0, 10)}.db`;
        const result = await electron_1.dialog.showSaveDialog({
            title: 'Salvar backup do Finance Hub',
            defaultPath: defaultName,
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        });
        if (result.canceled || !result.filePath) {
            return { ok: false, message: 'Backup cancelado.' };
        }
        (0, db_1.checkpointDatabase)();
        fs_1.default.copyFileSync(db_1.dbPath, result.filePath);
        return {
            ok: true,
            path: result.filePath,
            message: 'Backup salvo com sucesso.',
        };
    });
    electron_1.ipcMain.handle('maintenance:restore', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            title: 'Restaurar backup do Finance Hub',
            properties: ['openFile'],
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return { ok: false, message: 'Restauracao cancelada.' };
        }
        const sourcePath = result.filePaths[0];
        const safetyCopy = `${db_1.dbPath}.before-restore-${Date.now()}`;
        fs_1.default.copyFileSync(db_1.dbPath, safetyCopy);
        (0, db_1.closeDatabase)();
        fs_1.default.copyFileSync(sourcePath, db_1.dbPath);
        removeIfExists(`${db_1.dbPath}-wal`);
        removeIfExists(`${db_1.dbPath}-shm`);
        setTimeout(() => {
            electron_1.app.relaunch();
            electron_1.app.exit(0);
        }, 250);
        return {
            ok: true,
            path: sourcePath,
            restartScheduled: true,
            message: `Backup restaurado. Copia de seguranca criada em ${path_1.default.basename(safetyCopy)}.`,
        };
    });
}
function removeIfExists(filePath) {
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.rmSync(filePath, { force: true });
    }
}
