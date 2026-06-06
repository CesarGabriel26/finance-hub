import { Injectable } from '@angular/core';
import { DialogComponent, DialogVariant } from '../components/dialog/dialog.component';
import { ModalService } from './modal.service';

export interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private modalService: ModalService) {}

  async confirm(options: DialogOptions): Promise<boolean> {
    const ref = this.modalService.open<boolean>(DialogComponent, {
      ...options,
      showCancel: true,
    });

    return (await ref.closed) === true;
  }

  async alert(options: Omit<DialogOptions, 'cancelLabel'>): Promise<void> {
    const ref = this.modalService.open<boolean>(DialogComponent, {
      ...options,
      showCancel: false,
      confirmLabel: options.confirmLabel ?? 'Ok',
    });

    await ref.closed;
  }
}
