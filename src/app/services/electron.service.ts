import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  /** True quando rodando dentro do Electron */
  readonly isElectron: boolean = !!(
    typeof window !== 'undefined' && window.electronAPI?.isElectron
  );

  /** Retorna a versão do app Electron (undefined no browser) */
  async getVersion(): Promise<string | undefined> {
    if (!this.isElectron) return undefined;
    return window.electronAPI?.getVersion();
  }

  /** Retorna a plataforma (win32 | darwin | linux) ou undefined no browser */
  async getPlatform(): Promise<string | undefined> {
    if (!this.isElectron) return undefined;
    return window.electronAPI?.getPlatform();
  }
}
