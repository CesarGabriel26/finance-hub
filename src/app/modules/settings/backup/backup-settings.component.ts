import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppSettings } from '../../../models';
import { AppSettingsService } from '../../../services/app-settings.service';
import { AppUpdatesService } from '../../../services/app-updates.service';
import { DialogService } from '../../../services/dialog.service';
import { MaintenanceService } from '../../../services/maintenance.service';
import { NotificationsService } from '../../../services/notifications.service';
import { createBackupSettingsForm, notificationDaysAhead } from './backup-settings.utils';

@Component({
  selector: 'app-backup-settings',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './backup-settings.component.html',
  styleUrl: './backup-settings.component.css',
})
export class BackupSettingsComponent implements OnInit {
  message = signal('');
  loading = signal(false);
  settingsLoaded = signal(false);
  settings = signal<AppSettings | null>(null);

  form = createBackupSettingsForm();

  constructor(
    private maintenanceService: MaintenanceService,
    public appSettingsService: AppSettingsService,
    private appUpdatesService: AppUpdatesService,
    private dialogService: DialogService,
    private notificationsService: NotificationsService,
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  async save(): Promise<void> {
    if (!this.settingsLoaded()) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const settings = await this.appSettingsService.update(this.form.getRawValue());
      this.settings.set(settings);
      this.form.patchValue(settings, { emitEvent: false });
      this.message.set('Configuracoes salvas.');
    } finally {
      this.loading.set(false);
    }
  }

  async chooseAutoBackupDirectory(): Promise<void> {
    const settings = await this.appSettingsService.selectAutoBackupDirectory();
    this.settings.set(settings);
    this.form.patchValue(settings);
  }

  async runAutoBackupNow(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.appSettingsService.runAutoBackupNow();
      this.settings.set(result.settings);
      this.form.patchValue(result.settings);
      await this.dialogService.alert({
        title: result.ok ? 'Backup automatico criado' : 'Backup nao executado',
        message: result.ok
          ? `Arquivo salvo em:\n${result.path}`
          : 'Selecione uma pasta para backup automatico antes de executar.',
        variant: result.ok ? 'success' : 'warning',
      });
    } finally {
      this.loading.set(false);
    }
  }

  backup(): void {
    this.loading.set(true);
    this.maintenanceService.backup()
      .then(result => this.message.set(result.message))
      .finally(() => this.loading.set(false));
  }

  async restore(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Restaurar backup',
      message: 'Restaurar um backup substitui o banco atual e reinicia o aplicativo. Continuar?',
      confirmLabel: 'Restaurar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.loading.set(true);
    this.maintenanceService.restore()
      .then(result => this.message.set(result.message))
      .finally(() => this.loading.set(false));
  }

  async checkUpdates(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.appUpdatesService.check();
      await this.dialogService.alert({
        title: 'Atualizacoes',
        message: result.message,
        variant: result.status === 'error' ? 'danger' : result.status === 'available' ? 'success' : 'info',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async testNotifications(): Promise<void> {
    const daysAhead = notificationDaysAhead(this.form);
    const result = await this.notificationsService.checkDue({ daysAhead, force: true });
    await this.dialogService.alert({
      title: 'Notificacoes',
      message: result?.notified
        ? 'Notificacao enviada.'
        : 'Nenhuma conta proxima encontrada para notificar.',
      variant: result?.notified ? 'success' : 'info',
    });
  }

  private async loadSettings(): Promise<void> {
    this.settingsLoaded.set(false);
    const settings = await this.appSettingsService.get();
    this.settings.set(settings);
    this.form.patchValue(settings, { emitEvent: false });
    this.appSettingsService.apply(settings);
    this.settingsLoaded.set(true);
  }
}
