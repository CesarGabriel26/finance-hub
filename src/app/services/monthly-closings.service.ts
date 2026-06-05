import { EventEmitter, Injectable } from '@angular/core';
import type { MonthlyClosing, NewMonthlyClosing } from '../models/monthly-closing.model';

@Injectable({ providedIn: 'root' })
export class MonthlyClosingsService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.MonthlyClosingsApi!;
  }

  getAll(): Promise<MonthlyClosing[]> {
    return this.api.getAll();
  }

  upsert(data: NewMonthlyClosing): Promise<MonthlyClosing> {
    return this.api.upsert(data);
  }
}
