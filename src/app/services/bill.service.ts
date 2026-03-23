import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Bill } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private db = inject(DatabaseService);

  async getBills(type?: 'C' | 'D', status?: 'pending' | 'paid'): Promise<Bill[]> {
    return this.db.handleApi<Bill[]>('getBills', type, status);
  }

  async addBill(bill: Partial<Bill>): Promise<any> {
    return this.db.handleApi('addBill', bill);
  }

  async deleteBill(id: number): Promise<any> {
    return this.db.handleApi('deleteBill', id);
  }

  async payBill(data: { billId: number, accountId: number, paymentDate: string }): Promise<any> {
    return this.db.handleApi('payBill', data);
  }
}
