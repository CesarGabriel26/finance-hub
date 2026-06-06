"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const api_1 = require("./api");
const app_updates_1 = require("./api/app-updates");
const app_settings_1 = require("./api/app-settings");
const market_rates_1 = require("./api/market-rates");
const notifications_1 = require("./api/notifications");
const db_1 = require("./db");
let mainWindow = null;
const isDev = !electron_1.app.isPackaged;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        frame: true,
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Melhor prática de segurança
            contextIsolation: true, // Melhor prática de segurança
            sandbox: false,
        },
        icon: path.join(__dirname, '..', 'public', 'icon.png'),
    });
    // Em desenvolvimento: carrega via Angular dev server
    // Em produção: carrega o build estático
    if (isDev) {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '..', 'dist', 'finance-hub', 'browser', 'index.html'),
            protocol: 'file:',
            slashes: true,
        }));
    }
    // Mostrar a janela apenas quando estiver totalmente carregada
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Abrir links externos no browser padrão do sistema
    mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
        if (linkUrl.startsWith('http')) {
            electron_1.shell.openExternal(linkUrl);
        }
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    (0, db_1.runMigrations)(); // ← cria/atualiza tabelas antes de qualquer handler IPC
    void (0, market_rates_1.loadMarketRatesCache)();
    createWindow();
    (0, api_1.initFinancialApi)();
    (0, notifications_1.startDueNotificationsScheduler)();
    (0, app_settings_1.startAutomaticBackupScheduler)();
    (0, app_updates_1.configureAutoUpdates)();
    // macOS: recriar janela ao clicar no ícone do dock
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Exemplo de handler IPC para comunicação renderer <-> main
electron_1.ipcMain.handle('app:version', () => electron_1.app.getVersion());
electron_1.ipcMain.handle('app:platform', () => process.platform);
