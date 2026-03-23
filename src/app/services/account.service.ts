import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Account } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private db = inject(DatabaseService);

  async getAccounts(): Promise<Account[]> {
    return this.db.handleApi<Account[]>('getAccounts');
  }

  async addAccount(account: Partial<Account>): Promise<any> {
    return this.db.handleApi('addAccount', account);
  }

  async deleteAccount(id: number): Promise<any> {
    return this.db.handleApi('deleteAccount', id);
  }

  async updateAccountBalance(id: number, balance: number): Promise<any> {
    return this.db.handleApi('updateAccountBalance', id, balance);
  }

  async updateAccountName(id: number, name: string): Promise<any> {
    return this.db.handleApi('updateAccountName', id, name);
  }

  async recalculateBalance(accountId: number): Promise<any> {
    return this.db.handleApi('recalculateBalance', accountId);
  }
}
