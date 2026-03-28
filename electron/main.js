import electron from "electron";
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, session, dialog } = electron;
import path from "path";
import AutoLaunch from "auto-launch";
import Store from "electron-store";
import { fileURLToPath } from "url";
import { setupAPI } from "./src/api.js";
import { setupUpdater, checkForUpdates, downloadUpdate, installUpdate } from "./src/services/updater.services.js";
import { dbAll, dbGet, dbRun, closeDatabase } from "./src/services/database.services.js";
import { logInfo, logError, setupConsoleRedirection } from "./src/utils/logger.utils.js";
import { backupService } from "./src/services/backup.services.js";
import { recoveryService } from "./src/services/recovery.services.js";
import { restoreFromBackup } from "./src/utils/restore.utils.js";
import fs from "fs";
import { closeServer, openServer } from "./src/server/ws.server.js";

// -- 0. LOGGING INITIALIZATION --
setupConsoleRedirection();

/**
 * PRODUCTION-SAFE ELECTRON MAIN PROCESS (Finance Hub)
 * 
 * Optimized for Windows environments to resolve:
 * - "Gpu Cache Creation failed" / "Unable to create cache"
 * - "Acesso negado (0x5)" Chromium errors
 * - Persistent corrupted cache after updates
 * - App crashes before initialization
 */

// --- 1. INITIALIZATION & STABILITY SETTINGS ---

const isDev = process.env.NODE_ENV === "development";

// Force consistent userData path to avoid discrepancy between "Finance Hub" and "finance-hub"
const currentDataPath = app.getPath('userData');
if (app.isPackaged && currentDataPath.endsWith('Finance Hub')) {
    const newPath = path.join(path.dirname(currentDataPath), 'finance-hub');
    app.setPath('userData', newPath);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Improved icon path resolution for Production and Development
const getIconPath = () => {
    // In production (built), __dirname is usually resources/app/electron/
    // The public folder should be at resources/app/public/ if included in 'files'
    const prodPath = path.join(process.resourcesPath, "app", "public", "assets", "icons", "financehubicon.ico");
    const devPath = path.join(__dirname, "..", "public", "assets", "icons", "financehubicon.ico");
    const fallbackPath = path.join(__dirname, "assets", "icons", "financehubicon.ico");

    if (fs.existsSync(devPath)) return devPath;
    if (fs.existsSync(prodPath)) return prodPath;
    return fallbackPath;
};

const iconPath = getIconPath();
console.log(`[Resources] Icon path resolved to: ${iconPath}`);

// CRITICAL: Disable GPU acceleration early to prevent "Unable to create cache" errors
// This is the most effective way to avoid GPU-related locks on startup in many Windows environments
app.disableHardwareAcceleration();

// Persistent Store for version tracking and safe cache invalidation
const store = new Store();

// --- 2. CACHE & RECOVERY MANAGEMENT ---

/**
 * Safely clears Chromium cache using Electron's session API.
 * Wraps the async call to prevent crashes if the session is not yet fully ready.
 * Does NOT delete the database or user configurations.
 */
async function safeClearCache() {
    console.log("[Recovery] Attempting to clear Chromium cache...");
    try {
        const defaultSession = session.defaultSession;
        if (defaultSession) {
            await defaultSession.clearCache();
            console.log("[Recovery] Cache cleared successfully.");
            return true;
        }
    } catch (err) {
        console.error("[Recovery] Failed to clear cache via session:", err);
    }
    return false;
}

/**
 * Handles application recovery by clearing cache and relaunching.
 * Used during fatal renderer process failures to ensure the app can recover automatically.
 */
async function handleFatalRecovery(reason) {
    console.error(`[Recovery] Fatal error detected: ${reason}. Attempting auto-recovery...`);
    try {
        await safeClearCache();
    } catch (e) {
        console.error("[Recovery] Final cache cleanup failed:", e);
    }
    console.log("[Recovery] Relaunching application...");
    app.relaunch();
    app.exit(0);
}

/**
 * Validates app version and invalidates cache if necessary.
 * Prevents issues where old Chromium cache is incompatible with new app updates.
 * Runs as early as possible after 'ready'.
 */
async function checkVersionAndInvalidateCache() {
    const currentVersion = app.getVersion();
    let savedVersion;

    try {
        savedVersion = store.get('version');
    } catch (err) {
        console.warn("[Cache] Failed to retrieve saved version from store, resetting...", err);
        savedVersion = null;
    }

    if (savedVersion !== currentVersion) {
        console.log(`[Cache] Version change detected (${savedVersion || 'unknown'} -> ${currentVersion}).`);
        const cleared = await safeClearCache();
        if (cleared) {
            store.set('version', currentVersion);
            console.log("[Cache] Version-based cleanup completed successfully.");
        }
    }
}

// REGISTER RECOVERY HOOK: If the renderer process (Angular) crashes or is killed, 
// we automatically clear cache and relaunch to ensure the user doesn't need manual cleanup.
app.on('render-process-gone', (event, webContents, details) => {
    handleFatalRecovery(`Renderer process gone (${details.reason})`);
});

// --- 3. SINGLE INSTANCE LOCK ---

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// --- 4. WINDOW & TRAY MANAGEMENT ---

let mainWindow;
let tray;
let isQuitting = false;
let billCheckInterval;

const autoLauncher = new AutoLaunch({
    name: 'Finance Hub',
    path: app.getPath("exe"),
});

// Guard against auto-launch errors on startup
autoLauncher.isEnabled().then(enabled => {
    console.log(`[AutoLaunch] Is enabled: ${enabled}`);
}).catch(err => {
    console.warn(`[AutoLaunch] Status check failed: ${err.message}`);
});

function setupWindowCloseHandler() {
    if (!mainWindow) return;

    mainWindow.on("close", (event) => {
        if (isQuitting) return;

        // Always prevent default initially to handle the async check
        event.preventDefault();

        dbGet("SELECT value FROM settings WHERE key = 'minimized_to_tray'")
            .then(setting => {
                const shouldStayInTray = setting ? setting.value === 'true' : false; // Default to true if not set

                if (shouldStayInTray) {
                    logInfo("Window closed: Hiding to tray based on settings.");
                    mainWindow.hide();

                    // Professional notification
                    new Notification({
                        title: 'Finance Hub em segundo plano',
                        body: 'O aplicativo continua em execução na bandeja para processar notificações e backups automáticos.',
                        icon: iconPath
                    }).show();

                } else {
                    logInfo("Window closed: Quitting app based on settings.");
                    isQuitting = true;
                    app.quit();
                }
            })
            .catch(err => {
                logError(`Error checking tray setting: ${err.message}`);
                mainWindow.hide(); // Safe fallback: hide if check fails
            });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        closeServer()
    });
}

function showWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow();
    } else {
        mainWindow.show();
        mainWindow.focus();
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        icon: iconPath,
        show: false, // Don't show until ready-to-show to prevent white flashes
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.cjs")
        },
    });

    if (isDev) {
        mainWindow.loadURL("http://localhost:4200");
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/finance-hub/browser/index.html"));
        Menu.setApplicationMenu(null); // Clean production UI
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    setupWindowCloseHandler();
}

function createTray() {
    if (tray) return;

    try {
        if (!fs.existsSync(iconPath)) {
            console.error(`[Tray] Icon not found at ${iconPath}. Tray might not show.`);
        }

        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Abrir Finance Hub', click: () => showWindow() },
            { type: 'separator' },
            {
                label: 'Sair', click: () => {
                    isQuitting = true;
                    app.quit();
                    closeServer()
                }
            }
        ]);

        tray.setToolTip('Finance Hub');
        tray.setContextMenu(contextMenu);
        tray.on('double-click', () => showWindow());
        console.log("[Tray] Tray initialized successfully.");
    } catch (err) {
        console.error(`[Tray] Failed to create tray: ${err.message}`);
    }
}

// --- 5. NOTIFICATIONS LOGIC ---

async function checkDueBillsAndNotify() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    try {
        const lastNotified = await dbGet("SELECT value FROM settings WHERE key = 'last_notification_date'");
        if (lastNotified && lastNotified.value === todayStr) {
            return;
        }
    } catch (e) {
        console.error("Error checking last notification date", e);
    }

    const nextThreeDays = new Date();
    nextThreeDays.setDate(today.getDate() + 3);
    const nextThreeDaysStr = nextThreeDays.toISOString().split('T')[0];

    try {
        const dueBills = await dbAll(`
            SELECT b.*, c.name as category_name
            FROM bills b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'pending' AND b.due_date <= ? AND b.due_date >= ?
        `, [nextThreeDaysStr, todayStr]);

        if (dueBills.length > 0) {
            dueBills.forEach(bill => {
                new Notification({
                    title: 'Conta próxima do vencimento',
                    body: `${bill.description} vence em ${bill.due_date} - R$ ${bill.amount.toFixed(2)}`,
                    icon: iconPath
                }).show();
            });

            await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_notification_date', ?)", [todayStr]);
        }
    } catch (e) {
        console.error("Notification check failed:", e);
    }
}

// --- 6. APP LIFECYCLE & IPC ---

app.whenReady().then(async () => {
    // 6.1. EARLIEST PROTECTION: Clear cache BEFORE window creation if version changed
    // This ensures that corrupted cache files from previous versions don't crash the UI initialization
    await checkVersionAndInvalidateCache();

    // 6.2. BACKEND INITIALIZATION
    try {
        await setupAPI();
        openServer()
        console.log("Backend API setup complete.");
    } catch (error) {
        console.error("Failed to setup API:", error);
    }

    // 6.3. UI INITIALIZATION
    createWindow();
    createTray();

    // 6.4. AUTO UPDATER SETUP
    setupUpdater(mainWindow);

    // 6.5. BACKUP & RECOVERY INITIALIZATION
    try {
        logInfo("Finance Hub starting...");
        await recoveryService.initRecovery();
        backupService.setupAutoBackup();
        logInfo("Backup and Recovery systems initialized.");
    } catch (error) {
        logError(`Failed to initialize backup/recovery systems: ${error.message}`);
    }

    // 6.6. IPC HANDLERS
    ipcMain.handle("set-auto-start", async (_, enabled) => {
        try {
            if (enabled) await autoLauncher.enable();
            else await autoLauncher.disable();
            return await autoLauncher.isEnabled();
        } catch (err) {
            console.error("AutoLaunch error:", err);
            return false;
        }
    });

    ipcMain.handle("check-update", async () => {
        try {
            await checkForUpdates();
            return { success: true };
        } catch (error) {
            console.error("Update error:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("start-update-download", async () => {
        try {
            await downloadUpdate();
            return { success: true };
        } catch (error) {
            console.error("Download error:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("install-update", () => installUpdate());

    // 6.7. BACKUP & RESTORE IPC HANDLERS
    ipcMain.handle("backup-now", async () => {
        return await backupService.performBackup();
    });

    ipcMain.handle("restore-backup", async (_, filePath) => {
        return await restoreFromBackup(filePath);
    });

    ipcMain.handle("get-backup-settings", async () => {
        return await backupService.getSettings();
    });

    ipcMain.handle("set-backup-settings", async (_, settings) => {
        return await backupService.setSettings(settings);
    });

    ipcMain.handle("select-directory", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // --- 6.8. SCHEDULED TASKS (Delayed start to allow app stabilization)
    setTimeout(() => {
        checkDueBillsAndNotify();
        billCheckInterval = setInterval(checkDueBillsAndNotify, 6 * 60 * 60 * 1000);
    }, 5000);

    app.on("activate", () => showWindow());
});

app.on("window-all-closed", () => {
    // Finance Hub keeps running in tray unless explicitly quit
});

app.on("will-quit", async (event) => {
    console.log("Finance Hub is shutting down. Cleaning up...");

    // Clear background intervals
    if (billCheckInterval) clearInterval(billCheckInterval);
    backupService.stopAutoBackup();

    // Close database connection
    try {
        await closeDatabase();
        console.log("Database cleanup successful.");
    } catch (err) {
        console.error("Error during database cleanup:", err);
    }
});
