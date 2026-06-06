export type AppTheme = 'light' | 'dark';
export type ExperienceMode = 'beginner' | 'advanced';
export type AutoBackupFrequency = 'daily' | 'weekly';
export type AiCategorizationProvider = 'openai' | 'gemini';

export interface AppSettings {
  autoBackupEnabled: boolean;
  autoBackupDirectory: string;
  autoBackupFrequency: AutoBackupFrequency;
  lastAutoBackupAt: string | null;
  startWithWindows: boolean;
  dueNotificationsEnabled: boolean;
  dueNotificationDaysAhead: number;
  theme: AppTheme;
  defaultCurrency: string;
  experienceMode: ExperienceMode;
  aiCategorizationEnabled: boolean;
  aiCategorizationProvider: AiCategorizationProvider;
  openAiApiKey: string;
  openAiModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

export interface UpdateCheckResult {
  enabled: boolean;
  status: 'disabled' | 'checking' | 'available' | 'not-available' | 'error';
  version: string;
  message: string;
}
