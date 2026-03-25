import { app, BrowserWindow, ipcMain, Tray, Menu, Notification, session, dialog } from "electron";
import path from "path";
import AutoLaunch from "auto-launch";
import Store from "electron-store";
import { fileURLToPath } from "url";
import { setupAPI } from "./api.js";
import { setupUpdater, checkForUpdates, downloadUpdate, installUpdate } from "./updater.js";
import { dbAll, dbGet, dbRun } from "./database.js";
import { logInfo, logError } from "./utils/logger.js";
import { backupService } from "./utils/backupService.js";
import { recoveryService } from "./utils/recoveryService.js";
import { restoreFromBackup } from "./utils/restore.js";

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, "../public/assets/icons/financehubicon.ico");

// CRITICAL: Set userData as early as possible to a stable path
// This prevents 'temp' folder issues on Windows and ensures DB path consistency
const userDataPath = path.join(app.getPath('appData'), 'Finance Hub');
app.setPath('userData', userDataPath);

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

const autoLauncher = new AutoLaunch({
    name: 'Finance Hub',
    path: app.getPath("exe"),
});

function setupWindowCloseHandler() {
    if (!mainWindow) return;
    
    mainWindow.on("close", (event) => {
        if (isQuitting) return;
        
        // Always prevent default initially to handle the async check
        event.preventDefault();

        dbGet("SELECT value FROM settings WHERE key = 'minimized_to_tray'")
            .then(setting => {
                const shouldStayInTray = setting ? setting.value === 'true' : true; // Default to true if not set
                
                if (shouldStayInTray) {
                    logInfo("Window closed: Hiding to tray based on settings.");
                    mainWindow.hide();
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
    
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Abrir Finance Hub', click: () => showWindow() },
        { type: 'separator' },
        { label: 'Sair', click: () => {
            isQuitting = true;
            app.quit();
        }}
    ]);
    
    tray.setToolTip('Finance Hub');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => showWindow());
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
        setupAPI();
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

    // 6.8. SCHEDULED TASKS (Delayed start to allow app stabilization)
    setTimeout(checkDueBillsAndNotify, 5000); 
    setInterval(checkDueBillsAndNotify, 6 * 60 * 60 * 1000);

    app.on("activate", () => showWindow());
});

app.on("window-all-closed", () => {
    // Finance Hub keeps running in tray unless explicitly quit
});

app.on("will-quit", () => {
    logInfo("Finance Hub is shutting down.");
});
