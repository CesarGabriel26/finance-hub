import { EventEmitter, Injectable } from '@angular/core';
import type { AppSettings } from '../models/app-settings.model';

export interface AutoBackupRunResult {
  ok: boolean;
  path?: string;
  settings: AppSettings;
}

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  public updated = new EventEmitter<AppSettings>();

  private get api() {
    return window.AppSettingsApi!;
  }

  get(): Promise<AppSettings> {
    return this.api.get();
  }

  async update(data: Partial<AppSettings>): Promise<AppSettings> {
    const settings = await this.api.update(data);
    this.apply(settings);
    this.updated.emit(settings);
    return settings;
  }

  async selectAutoBackupDirectory(): Promise<AppSettings> {
    const settings = await this.api.selectAutoBackupDirectory();
    this.apply(settings);
    this.updated.emit(settings);
    return settings;
  }

  async runAutoBackupNow(): Promise<AutoBackupRunResult> {
    const result = await this.api.runAutoBackupNow();
    this.apply(result.settings);
    this.updated.emit(result.settings);
    return result;
  }

  apply(settings: Pick<AppSettings, 'theme' | 'experienceMode'>): void {
    this.applyTheme(settings.theme);
    this.applyExperienceMode(settings.experienceMode);
  }

  applyTheme(theme: AppSettings['theme']): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  applyExperienceMode(mode: AppSettings['experienceMode']): void {
    document.documentElement.dataset['experienceMode'] = mode;
  }
}
