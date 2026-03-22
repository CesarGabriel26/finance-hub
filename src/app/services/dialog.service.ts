import { Injectable, signal } from '@angular/core';

export type DialogType = 'success' | 'error' | 'warning' | 'info';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  currentDialog = signal<DialogOptions | null>(null);
  private resolveFn: ((value: boolean) => void) | null = null;

  alert(message: string, type: DialogType = 'info', title?: string): Promise<void> {
    return new Promise((resolve) => {
      this.currentDialog.set({
        message,
        type,
        title: title || this.getDefaultTitle(type),
        confirmText: 'OK',
        showCancel: false
      });
      this.resolveFn = () => {
        this.currentDialog.set(null);
        resolve();
      };
    });
  }

  confirm(message: string, type: DialogType = 'warning', title?: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.currentDialog.set({
        message,
        type,
        title: title || this.getDefaultTitle(type),
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        showCancel: true
      });
      this.resolveFn = (res) => {
        this.currentDialog.set(null);
        resolve(res);
      };
    });
  }

  success(message: string, title?: string) {
    return this.alert(message, 'success', title);
  }

  error(message: string, title?: string) {
    return this.alert(message, 'error', title);
  }

  warning(message: string, title?: string) {
    return this.alert(message, 'warning', title);
  }

  info(message: string, title?: string) {
    return this.alert(message, 'info', title);
  }

  private getDefaultTitle(type: DialogType): string {
    switch (type) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warning': return 'Aviso';
      case 'info': return 'Informação';
      default: return 'Aviso';
    }
  }

  handleAction(result: boolean) {
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = null;
    }
  }
}
