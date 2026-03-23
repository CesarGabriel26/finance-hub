import { app, BrowserWindow, ipcMain, Tray, Menu, Notification } from "electron";
import path from "path";
import AutoLaunch from "auto-launch";
import { fileURLToPath } from "url";
import { dbAll, dbGet, dbRun } from "./database.js";
import { setupAPI } from "./api.js";
import { setupUpdater, checkForUpdates, downloadUpdate, installUpdate } from "./updater.js";

const isDev = process.env.NODE_ENV === "development";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, "../public/assets/icons/financehubicon.ico");

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

let mainWindow;
let tray;
let isQuitting = false;
const autoLauncher = new AutoLaunch({
    name: 'Finance Hub',
    path: app.getPath("exe"),
});

// Prevent window from being destroyed on close
function setupWindowCloseHandler() {
    mainWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function showWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow();
        setupWindowCloseHandler();
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
        Menu.setApplicationMenu(null);
    }
}

function createTray() {
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

async function checkDueBillsAndNotify() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    try {
        const lastNotified = await dbGet("SELECT value FROM settings WHERE key = 'last_notification_date'");
        if (lastNotified && lastNotified.value === todayStr) {
            return; // Already notified today
        }
    } catch (e) {
        console.error("Error checking last notification date", e);
    }

    const nextThreeDays = new Date();
    nextThreeDays.setDate(today.getDate() + 3);
    const nextThreeDaysStr = nextThreeDays.toISOString().split('T')[0];

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
        
        try {
            await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_notification_date', ?)", [todayStr]);
        } catch (e) {
            console.error("Error saving last notification date", e);
        }
    }
}

app.whenReady().then(async () => {
    createWindow();
    setupWindowCloseHandler();
    createTray();
    setupAPI();

    // Setup auto-start setting handler
    ipcMain.handle("set-auto-start", async (_, enabled) => {
        try {
            if (enabled) {
                await autoLauncher.enable();
            } else {
                await autoLauncher.disable();
            }
            return await autoLauncher.isEnabled();
        } catch (err) {
            console.error("AutoLaunch error:", err);
            return false;
        }
    });

    // Setup Auto Updater
    setupUpdater(mainWindow);

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

    ipcMain.handle("install-update", () => {
        installUpdate();
    });

    // Check notifications on startup
    setTimeout(checkDueBillsAndNotify, 5000); 
    
    // Check every 6 hours
    setInterval(checkDueBillsAndNotify, 6 * 60 * 60 * 1000);

    app.on("activate", () => {
        showWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // app.quit(); // Handled by tray/isQuitting
    }
});

