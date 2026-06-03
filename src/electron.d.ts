// Tipos globais expostos pelo preload script do Electron
// Disponíveis como window.electronAPI dentro da aplicação Angular

interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  isElectron: boolean;
}

interface Window {
  electronAPI?: ElectronAPI;
}
