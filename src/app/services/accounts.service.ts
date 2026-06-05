import { EventEmitter, Injectable } from '@angular/core';
import type { Account, NewAccount } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  public updated = new EventEmitter();

  private get api() {
    return window.AccountsApi!;
  }

  /** Lista todas as contas */
  getAll(filters?: { type?: string, name?: string }): Promise<Account[]> {
    return this.api.getAll(filters);
  }

  /** Retorna uma conta pelo ID ou null */
  getById(id: string): Promise<Account | null> {
    return this.api.getById(id);
  }

  /** Cria uma nova conta */
  insert(data: NewAccount): Promise<Account> {
    return this.api.insert(data);
  }

  /** Atualiza campos de uma conta existente */
  update(id: string, data: Partial<NewAccount>): Promise<Account | null> {
    return this.api.update(id, data);
  }

  /** Remove uma conta (cascata nas transações vinculadas) */
  delete(id: string): Promise<Account | null> {
    return this.api.delete(id);
  }
}
