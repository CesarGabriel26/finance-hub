import { app, BrowserWindow, ipcMain, Tray, Menu, Notification } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { dbRun, dbAll, dbGet } from "./database.js";
import { setupAPI } from "./api.js";

const isDev = process.env.NODE_ENV === "development";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        icon: path.join(__dirname, "../public/favicon.ico"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.cjs")
        },
    });

    if (isDev) {
        mainWindow.loadURL("http://localhost:4200");
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/finance-hub/browser/index.html")); // Adjusted path for typical Angular build
    }

    mainWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, "../public/favicon.ico"));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Abrir Finance Hub', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'Sair', click: () => {
            isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setToolTip('Finance Hub');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => mainWindow.show());
}

async function checkDueBillsAndNotify() {
    const today = new Date();
    const nextThreeDays = new Date();
    nextThreeDays.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split('T')[0];
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
                icon: path.join(__dirname, "../public/favicon.ico")
            }).show();
        });
    }
}

app.whenReady().then(async () => {
    createWindow();
    createTray();
    setupAPI();

    // Setup auto-start setting handler
    ipcMain.handle("set-auto-start", (_, enabled) => {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            path: app.getPath("exe"),
        });
        return app.getLoginItemSettings().openAtLogin;
    });

    // Check notifications on startup
    setTimeout(checkDueBillsAndNotify, 5000); 
    
    // Check every 6 hours
    setInterval(checkDueBillsAndNotify, 6 * 60 * 60 * 1000);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // app.quit(); // Handled by tray/isQuitting
    }
});

