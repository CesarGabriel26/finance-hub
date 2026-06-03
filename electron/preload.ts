import { contextBridge, ipcRenderer } from 'electron';

// Expõe APIs seguras do Electron para o processo renderer (Angular)
// Acessíveis via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações do app
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getPlatform: (): Promise<string> => ipcRenderer.invoke('app:platform'),

  // Utilitário para verificar se está rodando dentro do Electron
  isElectron: true,
});
