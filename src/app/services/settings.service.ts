import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  settings = signal<{ [key: string]: any }>({});

  constructor() {
    this.loadSettings();
  }

  async loadSettings() {
    const s = await (window as any).api.getSettings();
    this.settings.set(s);
  }

  async updateSetting(key: string, value: any) {
    await (window as any).api.updateSetting(key, value);
    if (key === 'open_at_login') {
      await (window as any).api.setAutoStart(value);
    }
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  async checkNotifications() {
    return await (window as any).api.checkDueBills();
  }

  async getBackupSettings() {
    return await (window as any).api.getBackupSettings();
  }

  async setBackupSettings(settings: any) {
    return await (window as any).api.setBackupSettings(settings);
  }

  async backupNow() {
    return await (window as any).api.backupNow();
  }

  async restoreBackup(filePath: string) {
    return await (window as any).api.restoreBackup(filePath);
  }

  async selectDirectory() {
    return await (window as any).api.selectDirectory();
  }
}
