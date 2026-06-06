import { Injectable } from '@angular/core';
import type { UpdateCheckResult } from '../models/app-settings.model';

@Injectable({ providedIn: 'root' })
export class AppUpdatesService {
  private get api() {
    return window.AppUpdatesApi!;
  }

  check(): Promise<UpdateCheckResult> {
    return this.api.check();
  }
}
