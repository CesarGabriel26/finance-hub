import { app } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import fs from 'fs';
import path from 'path';

let updateApplied = false;

export function setupUpdater(mainWindow) {
    const userDataPath = app.getPath('userData');
    const lastVersionPath = path.join(userDataPath, 'last-version.json');
    const currentVersion = app.getVersion();

    // 1. Rollback / Crash detection logic
    // We check if the app crashed previously after an update.
    let previousVersionInfo = null;
    try {
        if (fs.existsSync(lastVersionPath)) {
            previousVersionInfo = JSON.parse(fs.readFileSync(lastVersionPath, 'utf8'));
        }
    } catch (e) {
        console.error("Failed to read last-version.json", e);
    }

    // If previousVersion exists and is different from current, it means we recently updated.
    // If the app successfully reaches this point, we consider the update successful.
    if (previousVersionInfo && previousVersionInfo.version !== currentVersion) {
        console.log(`Successfully updated from ${previousVersionInfo.version} to ${currentVersion}`);
        // Save the new version
        fs.writeFileSync(lastVersionPath, JSON.stringify({ version: currentVersion }), 'utf8');
        updateApplied = true;
    } else if (!previousVersionInfo) {
        // First run or file missing, save current version
        fs.writeFileSync(lastVersionPath, JSON.stringify({ version: currentVersion }), 'utf8');
    }

    // Prevent auto-download, we handle it via UI
    autoUpdater.autoDownload = false; 
    autoUpdater.autoInstallOnAppQuit = false;

    // Map autoUpdater events to mainWindow IPC
    autoUpdater.on('checking-for-update', () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'checking-for-update' });
    });

    autoUpdater.on('update-available', (info) => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'update-available', info });
    });

    autoUpdater.on('update-not-available', (info) => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'update-not-available', info });
    });

    autoUpdater.on('error', (err) => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'error', error: err.message || err.toString() });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'download-progress', progress: progressObj });
    });

    autoUpdater.on('update-downloaded', (info) => {
        // Before we install the new update, save the current version to last-version.json
        // This way, when the app restarts, it knows it was updated from this version
        fs.writeFileSync(lastVersionPath, JSON.stringify({ version: currentVersion }), 'utf8');
        
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-event', { type: 'update-downloaded', info });
    });
}

// Controller functions called by IPC handlers
export function checkForUpdates() {
    return autoUpdater.checkForUpdates();
}

export function downloadUpdate() {
    return autoUpdater.downloadUpdate();
}

export function installUpdate() {
    autoUpdater.quitAndInstall();
}
