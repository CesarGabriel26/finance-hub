import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ModalService } from '../../services/modal.service';

export type DialogVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-dialog',
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  @Input() title = 'Confirmar acao';
  @Input() message = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Input() variant: DialogVariant = 'info';
  @Input() showCancel = true;

  constructor(private modalService: ModalService) {}

  confirm(): void {
    this.modalService.close(true);
  }

  cancel(): void {
    this.modalService.close(false);
  }

  icon(): string {
    const icons: Record<DialogVariant, string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      danger: 'error',
    };

    return icons[this.variant];
  }

  iconClass(): string {
    const classes: Record<DialogVariant, string> = {
      info: 'text-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))]',
      success: 'text-success bg-[color-mix(in_oklch,var(--success)_12%,var(--card))]',
      warning: 'text-amber-700 bg-amber-100',
      danger: 'text-danger bg-[color-mix(in_oklch,var(--danger)_12%,var(--card))]',
    };

    return classes[this.variant];
  }
}
