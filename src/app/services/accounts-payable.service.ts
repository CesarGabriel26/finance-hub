import { EventEmitter, Injectable } from '@angular/core';
import type { AccountPayable, NewAccountPayable } from '../models/account-payable.model';

@Injectable({ providedIn: 'root' })
export class AccountsPayableService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.AccountsPayableApi!;
  }

  getAll(filters?: Record<string, unknown>): Promise<AccountPayable[]> {
    return this.api.getAll(filters);
  }

  getById(id: string): Promise<AccountPayable | null> {
    return this.api.getById(id);
  }

  insert(data: NewAccountPayable): Promise<AccountPayable> {
    return this.api.insert(data);
  }

  update(id: string, data: Partial<NewAccountPayable>): Promise<AccountPayable | null> {
    return this.api.update(id, data);
  }

  delete(id: string): Promise<AccountPayable | null> {
    return this.api.delete(id);
  }
}
