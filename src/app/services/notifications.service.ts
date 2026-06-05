import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private get api() {
    return window.NotificationsApi;
  }

  checkDue(options?: { daysAhead?: number; force?: boolean }) {
    return this.api?.checkDue(options);
  }
}
