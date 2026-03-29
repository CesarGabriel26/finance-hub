import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';
import { LucideAngularModule, Settings, Bell, Monitor, Power, Folder, Plus, Trash2, RefreshCw, HardDrive, Moon, Sun, Lightbulb } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  settingsService = inject(SettingsService);
  themeService = inject(ThemeService);
  
  readonly SettingsIcon = Settings;
  readonly BellIcon = Bell;
  readonly MonitorIcon = Monitor;
  readonly PowerIcon = Power;
  readonly FolderIcon = Folder;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly RefreshIcon = RefreshCw;
  readonly BackupIcon = HardDrive;
  readonly MoonIcon = Moon;
  readonly SunIcon = Sun;
  readonly LightbulbIcon = Lightbulb;

  backupPaths = signal<string[]>([]);
  backupFrequency = signal<string>('daily');
  isBackingUp = signal<boolean>(false);
  backupMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);

  async ngOnInit() {
    const settings = await this.settingsService.getBackupSettings();
    this.backupPaths.set(settings.backup_paths || []);
    this.backupFrequency.set(settings.backup_frequency || 'daily');
  }

  toggleSetting(key: string) {
    const current = this.settingsService.settings()[key];
    this.settingsService.updateSetting(key, !current);
  }

  async addBackupPath() {
    const path = await this.settingsService.selectDirectory();
    if (path && !this.backupPaths().includes(path)) {
      const newPaths = [...this.backupPaths(), path];
      this.backupPaths.set(newPaths);
      await this.saveBackupSettings();
    }
  }

  async removePath(path: string) {
    const newPaths = this.backupPaths().filter(p => p !== path);
    this.backupPaths.set(newPaths);
    await this.saveBackupSettings();
  }

  async onFrequencyChange(event: any) {
    this.backupFrequency.set(event.target.value);
    await this.saveBackupSettings();
  }

  async saveBackupSettings() {
    await this.settingsService.setBackupSettings({
      backup_paths: this.backupPaths(),
      backup_frequency: this.backupFrequency()
    });
  }

  async triggerBackup() {
    if (this.isBackingUp()) return;
    
    this.isBackingUp.set(true);
    this.backupMessage.set(null);
    
    try {
      const result = await this.settingsService.backupNow();
      if (result.success) {
        this.backupMessage.set({ text: 'Backup realizado com sucesso!', type: 'success' });
      } else {
        this.backupMessage.set({ text: `Falha no backup: ${result.error}`, type: 'error' });
      }
    } catch (err: any) {
      this.backupMessage.set({ text: `Erro: ${err.message}`, type: 'error' });
    } finally {
      this.isBackingUp.set(false);
      setTimeout(() => this.backupMessage.set(null), 5000);
    }
  }
}
