import { Injectable, inject } from '@angular/core';
import { BillService } from './bill.service';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private billService = inject(BillService);
  private accountService = inject(AccountService);

  async getPredictiveBalance(days: number): Promise<number> {
    const accounts = await this.accountService.getAccounts();
    const currentBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + days);

    const pendingBills = await this.billService.getBills(undefined, 'pending');
    
    // Filter bills within range and ignore past transactions (those are already reflected in balance or will be paid)
    // Actually, pending bills in the system represent future commitments.
    const billsInRange = pendingBills.filter(bill => {
      const dueDate = new Date(bill.due_date);
      return dueDate <= targetDate && dueDate >= today;
    });

    const projection = billsInRange.reduce((acc, bill) => {
      return acc + (bill.type === 'C' ? bill.amount : -bill.amount);
    }, currentBalance);

    return projection;
  }
}
