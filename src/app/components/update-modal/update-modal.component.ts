import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateService } from '../../services/update.service';
import { LucideAngularModule, Download, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-update-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.css']
})
export class UpdateModalComponent {
  updateService = inject(UpdateService);
  
  readonly DownloadIcon = Download;
  readonly RefreshCwIcon = RefreshCw;
  readonly XIcon = X;
  readonly AlertIcon = AlertCircle;
  readonly CheckIcon = CheckCircle;

  get state() { return this.updateService.updateState(); }
  get progress() { return this.updateService.downloadProgress(); }
  get speed() { return this.updateService.downloadSpeed(); }
  get newVersion() { return this.updateService.newVersion(); }
  get errorMsg() { return this.updateService.errorMessage(); }
  get isVisible() { return this.updateService.showModal(); }

  formatSpeed(bytesPerSecond: number): string {
    if (!bytesPerSecond) return '0 B/s';
    const mb = bytesPerSecond / (1024 * 1024);
    return `${mb.toFixed(2)} MB/s`;
  }

  download() {
    this.updateService.downloadUpdate();
  }

  install() {
    this.updateService.installUpdate();
  }

  close() {
    this.updateService.closeModal();
  }
}
