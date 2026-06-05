import { EventEmitter, Injectable } from '@angular/core';
import type { AccountReceivable, NewAccountReceivable } from '../models/account-receivable.model';

@Injectable({ providedIn: 'root' })
export class AccountsReceivableService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.AccountsReceivableApi!;
  }

  getAll(filters?: Record<string, unknown>): Promise<AccountReceivable[]> {
    return this.api.getAll(filters);
  }

  getById(id: string): Promise<AccountReceivable | null> {
    return this.api.getById(id);
  }

  insert(data: NewAccountReceivable): Promise<AccountReceivable> {
    return this.api.insert(data);
  }

  update(
    id: string,
    data: Partial<NewAccountReceivable>,
  ): Promise<AccountReceivable | null> {
    return this.api.update(id, data);
  }

  delete(id: string): Promise<AccountReceivable | null> {
    return this.api.delete(id);
  }
}
