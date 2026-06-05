import { EventEmitter, Injectable } from '@angular/core';
import type {
  AccountStatementBalance,
  NewAccountStatementBalance,
} from '../models/account-statement-balance.model';

@Injectable({ providedIn: 'root' })
export class AccountStatementBalancesService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.AccountStatementBalancesApi!;
  }

  getAll(filters?: Record<string, unknown>): Promise<AccountStatementBalance[]> {
    return this.api.getAll(filters);
  }

  upsert(data: NewAccountStatementBalance): Promise<AccountStatementBalance> {
    return this.api.upsert(data);
  }
}
