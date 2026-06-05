import { app, BrowserWindow, shell, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { initFinancialApi } from './api';
import { loadMarketRatesCache } from './api/market-rates';
import { startDueNotificationsScheduler } from './api/notifications';
import { runMigrations } from './db';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,   // Melhor prática de segurança
      contextIsolation: true,   // Melhor prática de segurança
      sandbox: false,
    },
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
  });

  // Em desenvolvimento: carrega via Angular dev server
  // Em produção: carrega o build estático
  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '..', 'dist', 'finance-hub', 'browser', 'index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // Mostrar a janela apenas quando estiver totalmente carregada
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Abrir links externos no browser padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    if (linkUrl.startsWith('http')) {
      shell.openExternal(linkUrl);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  runMigrations();   // ← cria/atualiza tabelas antes de qualquer handler IPC
  void loadMarketRatesCache();
  createWindow();
  initFinancialApi();
  startDueNotificationsScheduler();

  // macOS: recriar janela ao clicar no ícone do dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Exemplo de handler IPC para comunicação renderer <-> main
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);
