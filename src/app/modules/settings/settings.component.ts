import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { LucideAngularModule, Settings, Bell, Monitor, Power } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  readonly SettingsIcon = Settings;
  readonly BellIcon = Bell;
  readonly MonitorIcon = Monitor;
  readonly PowerIcon = Power;

  toggleSetting(key: string) {
    const current = this.settingsService.settings()[key];
    this.settingsService.updateSetting(key, !current);
  }
}
