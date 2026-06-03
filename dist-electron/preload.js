"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expõe APIs seguras do Electron para o processo renderer (Angular)
// Acessíveis via window.electronAPI
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Informações do app
    getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    getPlatform: () => electron_1.ipcRenderer.invoke('app:platform'),
    // Utilitário para verificar se está rodando dentro do Electron
    isElectron: true,
});
