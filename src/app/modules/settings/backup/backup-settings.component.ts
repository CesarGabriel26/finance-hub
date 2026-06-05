import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MaintenanceService } from '../../../services/maintenance.service';

@Component({
  selector: 'app-backup-settings',
  imports: [CommonModule],
  templateUrl: './backup-settings.component.html',
  styleUrl: './backup-settings.component.css',
})
export class BackupSettingsComponent {
  message = signal('');
  loading = signal(false);

  constructor(private maintenanceService: MaintenanceService) {}

  backup(): void {
    this.loading.set(true);
    this.maintenanceService.backup()
      .then(result => this.message.set(result.message))
      .finally(() => this.loading.set(false));
  }

  restore(): void {
    const confirmed = confirm('Restaurar um backup substitui o banco atual e reinicia o aplicativo. Continuar?');
    if (!confirmed) return;

    this.loading.set(true);
    this.maintenanceService.restore()
      .then(result => this.message.set(result.message))
      .finally(() => this.loading.set(false));
  }
}
