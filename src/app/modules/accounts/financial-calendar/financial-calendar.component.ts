import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccountPayable, AccountReceivable } from '../../../models';
import { AccountsPayableService } from '../../../services/accounts-payable.service';
import { AccountsReceivableService } from '../../../services/accounts-receivable.service';
import { InputComponent } from '../../../components/input/input.component';

type CalendarItem = {
  id: string;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  party: string;
};

@Component({
  selector: 'app-financial-calendar',
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, InputComponent],
  templateUrl: './financial-calendar.component.html',
  styleUrl: './financial-calendar.component.css',
})
export class FinancialCalendarComponent implements OnInit {
  payables = signal<AccountPayable[]>([]);
  receivables = signal<AccountReceivable[]>([]);

  filters = new FormGroup({
    month: new FormControl<number>(new Date().getMonth() + 1, { nonNullable: true }),
    year: new FormControl<number>(new Date().getFullYear(), { nonNullable: true }),
  });

  constructor(
    private payablesService: AccountsPayableService,
    private receivablesService: AccountsReceivableService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.subscribe(() => this.load());
  }

  items(): CalendarItem[] {
    return [
      ...this.payables().map(item => ({
        id: item.id,
        type: 'payable' as const,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        status: item.status,
        party: item.payee,
      })),
      ...this.receivables().map(item => ({
        id: item.id,
        type: 'receivable' as const,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        status: item.status,
        party: item.payer,
      })),
    ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  monthDays(): Array<{ day: number; date: string; items: CalendarItem[] }> {
    const month = Number(this.filters.value.month);
    const year = Number(this.filters.value.year);
    const days = new Date(year, month, 0).getDate();

    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        day,
        date,
        items: this.items().filter(item => item.dueDate.slice(0, 10) === date),
      };
    });
  }

  totalToPay(): number {
    return this.payables()
      .filter(item => item.status !== 'paid' && item.status !== 'canceled')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  totalToReceive(): number {
    return this.receivables()
      .filter(item => item.status !== 'received' && item.status !== 'canceled')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      overdue: 'Vencida',
      paid: 'Paga',
      received: 'Recebida',
      canceled: 'Cancelada',
    };

    return labels[status] ?? status;
  }

  private load(): void {
    const month = Number(this.filters.value.month);
    const year = Number(this.filters.value.year);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    Promise.all([
      this.payablesService.getAll({ dueDate: { between: [start, end] } }),
      this.receivablesService.getAll({ dueDate: { between: [start, end] } }),
    ]).then(([payables, receivables]) => {
      this.payables.set(payables);
      this.receivables.set(receivables);
    });
  }
}
