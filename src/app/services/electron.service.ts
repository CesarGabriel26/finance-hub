import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ElectronService {

  constructor(
    private http: HttpClient
  ) { }

  /** True quando rodando dentro do Electron */
  readonly isElectron: boolean = !!(
    typeof window !== 'undefined' && window.AppApi?.isElectron
  );

  /** Versão do app Electron (undefined no browser) */
  async getVersion(): Promise<string | undefined> {
    if (!this.isElectron) return undefined;
    return window.AppApi?.getVersion();
  }

  /** Plataforma (win32 | darwin | linux) ou undefined no browser */
  async getPlatform(): Promise<string | undefined> {
    if (!this.isElectron) return undefined;
    return window.AppApi?.getPlatform();
  }
}
