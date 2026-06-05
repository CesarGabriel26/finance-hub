import { EventEmitter, Injectable } from '@angular/core';
import type {
  AccountReconciliation,
  NewAccountReconciliation,
} from '../models/account-reconciliation.model';

@Injectable({ providedIn: 'root' })
export class AccountReconciliationsService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.AccountReconciliationsApi!;
  }

  getAll(period?: string): Promise<AccountReconciliation[]> {
    return this.api.getAll(period);
  }

  upsert(data: NewAccountReconciliation): Promise<AccountReconciliation> {
    return this.api.upsert(data);
  }
}
