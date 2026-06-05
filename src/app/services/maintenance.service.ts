import { Injectable } from '@angular/core';

export interface MaintenanceResult {
  ok: boolean;
  path?: string;
  restartScheduled?: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private get api() {
    return window.MaintenanceApi!;
  }

  backup(): Promise<MaintenanceResult> {
    return this.api.backup();
  }

  restore(): Promise<MaintenanceResult> {
    return this.api.restore();
  }
}
