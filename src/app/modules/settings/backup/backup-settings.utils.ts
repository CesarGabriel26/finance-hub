import { FormControl, FormGroup, Validators } from '@angular/forms';
import type {
  AiCategorizationProvider,
  AppTheme,
  AutoBackupFrequency,
  ExperienceMode,
} from '../../../models';

export type BackupSettingsForm = FormGroup<{
  autoBackupEnabled: FormControl<boolean>;
  autoBackupDirectory: FormControl<string>;
  autoBackupFrequency: FormControl<AutoBackupFrequency>;
  startWithWindows: FormControl<boolean>;
  dueNotificationsEnabled: FormControl<boolean>;
  dueNotificationDaysAhead: FormControl<number>;
  theme: FormControl<AppTheme>;
  defaultCurrency: FormControl<string>;
  experienceMode: FormControl<ExperienceMode>;
  aiCategorizationEnabled: FormControl<boolean>;
  aiCategorizationProvider: FormControl<AiCategorizationProvider>;
  openAiApiKey: FormControl<string>;
  openAiModel: FormControl<string>;
  geminiApiKey: FormControl<string>;
  geminiModel: FormControl<string>;
}>;

export function createBackupSettingsForm(): BackupSettingsForm {
  return new FormGroup({
    autoBackupEnabled: new FormControl(false, { nonNullable: true }),
    autoBackupDirectory: new FormControl('', { nonNullable: true }),
    autoBackupFrequency: new FormControl<AutoBackupFrequency>('daily', { nonNullable: true }),
    startWithWindows: new FormControl(false, { nonNullable: true }),
    dueNotificationsEnabled: new FormControl(true, { nonNullable: true }),
    dueNotificationDaysAhead: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(30)],
    }),
    theme: new FormControl<AppTheme>('light', { nonNullable: true }),
    defaultCurrency: new FormControl('BRL', { nonNullable: true }),
    experienceMode: new FormControl<ExperienceMode>('beginner', { nonNullable: true }),
    aiCategorizationEnabled: new FormControl(false, { nonNullable: true }),
    aiCategorizationProvider: new FormControl<AiCategorizationProvider>('openai', { nonNullable: true }),
    openAiApiKey: new FormControl('', { nonNullable: true }),
    openAiModel: new FormControl('gpt-5.4-nano', { nonNullable: true }),
    geminiApiKey: new FormControl('', { nonNullable: true }),
    geminiModel: new FormControl('gemini-3.5-flash', { nonNullable: true }),
  });
}

export function notificationDaysAhead(form: BackupSettingsForm): number {
  return Number(form.controls.dueNotificationDaysAhead.value) || 0;
}
