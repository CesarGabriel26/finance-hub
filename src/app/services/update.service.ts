import { Injectable, signal } from '@angular/core';

export type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  updateState = signal<UpdateState>('idle');
  downloadProgress = signal<number>(0);
  downloadSpeed = signal<number>(0);
  errorMessage = signal<string>('');
  newVersion = signal<string>('');
  showModal = signal<boolean>(false);

  constructor() {
    this.listenToUpdateEvents();
  }

  private listenToUpdateEvents() {
    if ((window as any).api && (window as any).api.onUpdateEvent) {
      (window as any).api.onUpdateEvent((data: any) => {
        switch (data.type) {
          case 'checking-for-update':
            this.updateState.set('checking');
            break;
          case 'update-available':
            this.updateState.set('available');
            this.newVersion.set(data.info?.version || '');
            this.showModal.set(true);
            break;
          case 'update-not-available':
            this.updateState.set('idle');
            break;
          case 'download-progress':
            this.updateState.set('downloading');
            this.downloadProgress.set(Math.round(data.progress.percent));
            this.downloadSpeed.set(data.progress.bytesPerSecond);
            break;
          case 'update-downloaded':
            this.updateState.set('ready');
            break;
          case 'error':
            this.updateState.set('error');
            this.errorMessage.set(data.error);
            this.showModal.set(true);
            break;
        }
      });
    }
  }

  async checkForUpdates() {
    this.updateState.set('checking');
    if ((window as any).api && (window as any).api.checkUpdate) {
      await (window as any).api.checkUpdate();
    }
  }

  async downloadUpdate() {
    this.updateState.set('downloading');
    this.downloadProgress.set(0);
    if ((window as any).api && (window as any).api.startUpdateDownload) {
      await (window as any).api.startUpdateDownload();
    }
  }

  installUpdate() {
    if ((window as any).api && (window as any).api.installUpdate) {
      (window as any).api.installUpdate();
    }
  }

  closeModal() {
    this.showModal.set(false);
  }
}
