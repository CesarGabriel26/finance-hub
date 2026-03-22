import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogType } from '../../services/dialog.service';
import { LucideAngularModule, CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css',
  animations: [
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})
export class DialogComponent {
  dialogService = inject(DialogService);

  readonly SuccessIcon = CheckCircle;
  readonly ErrorIcon = AlertCircle;
  readonly WarningIcon = AlertTriangle;
  readonly InfoIcon = Info;
  readonly CloseIcon = X;

  get config() {
    return this.dialogService.currentDialog();
  }

  close(result: boolean) {
    this.dialogService.handleAction(result);
  }

  getIcon(type?: DialogType) {
    switch (type) {
      case 'success': return this.SuccessIcon;
      case 'error': return this.ErrorIcon;
      case 'warning': return this.WarningIcon;
      case 'info': return this.InfoIcon;
      default: return this.InfoIcon;
    }
  }

  getIconClass(type?: DialogType): string {
    switch (type) {
      case 'success': return 'text-success bg-success/10 order-success/20';
      case 'error': return 'text-danger bg-danger/10 border-danger/20';
      case 'warning': return 'text-warning bg-warning/10 border-warning/20';
      case 'info': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  }

  getButtonClass(type?: DialogType): string {
    switch (type) {
      case 'success': return 'bg-success hover:bg-success/90 focus:ring-success/50';
      case 'error': return 'bg-danger hover:bg-danger/90 focus:ring-danger/50';
      case 'warning': return 'bg-warning hover:bg-warning/90 focus:ring-warning/50';
      case 'info': return 'bg-primary hover:bg-primary/90 focus:ring-primary/50';
      default: return 'bg-primary hover:bg-primary/90 focus:ring-primary/50';
    }
  }
}
