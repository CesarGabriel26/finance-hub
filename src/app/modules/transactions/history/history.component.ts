import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  DataTableColumn,
  DataTableComponent,
} from '../../../components/data-table/data-table.component';
import { DataFilter } from '../../../utils/data-filter';
import { SelectComponent } from '../../../components/select/select.component';
import { DateRangeInputComponent, DateRange } from '../../../components/date-range-input/date-range-input.component';
import { ContextMenuComponent, ContextMenuTriggerDirective, ContextMenuItem } from '../../../components/context-menu/context-menu.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

interface TransactionTableRow extends Record<string, unknown> {
  id: string;
  icon: string;
  merchant: string;
  category: string;
  date: Date;
  amount: number;
}

@Component({
  selector: 'app-history.component',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DataTableComponent,
    SelectComponent,
    DateRangeInputComponent,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class TransactionsHistoryComponent {

  readonly menuItems: ContextMenuItem<TransactionTableRow>[] = [
    {
      label: 'Visualizar detalhes',
      icon: 'visibility',
      onClick: (tx) => alert(`Visualizando detalhes de: ${tx.merchant}`),
    },
    {
      label: 'Editar transação',
      icon: 'edit',
      onClick: (tx) => alert(`Editando transação: ${tx.merchant}`),
    },
    {
      isSeparator: true,
    },
    {
      label: 'Excluir transação',
      icon: 'delete',
      onClick: (tx) => alert(`Excluindo transação de valor ${tx.amount}`),
      isDisabled: (tx) => tx.amount > 1000, // Exemplo: não permite excluir recebimentos maiores que 1000
    }
  ];

  filters = new FormGroup({
    filter: new FormControl<string>(''),
    account: new FormControl<number | null>(null),
    dateRange: new FormControl<DateRange | null>(null),
    type: new FormControl<string>('a'),
  })

  readonly transactions: TransactionTableRow[] = [
    {
      id: 'tx-001',
      icon: 'local_cafe',
      merchant: 'Blue Bottle Coffee',
      category: 'Food & Drink',
      date: new Date('2026-06-02T10:24:00'),
      amount: -6.5,
      currency: 'BRL'
    },
    {
      id: 'tx-002',
      icon: 'shopping_cart',
      merchant: 'Whole Foods Market',
      category: 'Groceries',
      date: new Date('2026-06-01T15:10:00'),
      amount: -142.3,
      currency: 'BRL'
    },
    {
      id: 'tx-003',
      icon: 'account_balance_wallet',
      merchant: 'Stripe Payout',
      category: 'Income',
      date: new Date('2026-05-30T09:00:00'),
      amount: 4200,
      currency: 'BRL'
    },
    {
      id: 'tx-004',
      icon: 'directions_car',
      merchant: 'Uber Technologies',
      category: 'Transport',
      date: new Date('2026-05-29T18:36:00'),
      amount: -24.1,
      currency: 'BRL'
    },
    {
      id: 'tx-005',
      icon: 'calendar_month',
      merchant: 'Netflix Subscription',
      category: 'Entertainment',
      date: new Date('2026-05-28T08:00:00'),
      amount: -19.99,
      currency: 'BRL'
    },
  ];

  readonly transactionColumns: DataTableColumn<TransactionTableRow>[] = [
    { key: 'merchant', label: 'Estabelecimento' },
    { key: 'category', label: 'Categoria' },
    { key: 'date', label: 'Data' },
    { key: 'amount', label: 'Valor', align: 'right' },
  ];

  readonly transactionFilter: DataFilter<TransactionTableRow> | null = null;

  identifyTransaction(row: TransactionTableRow): string {
    return row.id;
  }

  isIncome(row: TransactionTableRow): boolean {
    return row.amount > 0;
  }
}
