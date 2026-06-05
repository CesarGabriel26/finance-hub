import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { DateRange, DateRangeInputComponent } from '../../../components/date-range-input/date-range-input.component';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { Account, Category, Transaction } from '../../../models';
import { AccountsService } from '../../../services/accounts.service';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { TransactionsService } from '../../../services/transactions.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';

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
    ReactiveFormsModule,
    InputComponent,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class TransactionsHistoryComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);
  accountOptions = signal<SelectOption[]>([{ value: '', label: 'Todas' }]);

  readonly menuItems: ContextMenuItem<Transaction>[] = [
    {
      label: 'Editar transacao',
      icon: 'edit',
      onClick: transaction => this.openModal(transaction),
    },
    {
      label: 'Excluir transacao',
      icon: 'delete',
      onClick: transaction => this.delete(transaction),
    },
  ];

  filters = new FormGroup({
    filter: new FormControl<string>('', { nonNullable: true }),
    account: new FormControl<string>('', { nonNullable: true }),
    dateRange: new FormControl<DateRange | null>(null),
    type: new FormControl<string>('', { nonNullable: true }),
  });

  readonly transactionColumns: DataTableColumn<Transaction>[] = [
    { key: 'description', label: 'Descricao' },
    { key: 'categoryId', label: 'Categoria' },
    { key: 'date', label: 'Data' },
    { key: 'amount', label: 'Valor', align: 'right' },
  ];

  constructor(
    private transactionsService: TransactionsService,
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadReferences();
    this.search();

    this.transactionsService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
      )
      .subscribe(() => this.search());
  }

  identifyTransaction(row: Transaction): string {
    return row.id;
  }

  openModal(transaction?: Transaction): void {
    this.modalService.open(TransactionFormComponent, { transaction });
  }

  search(): void {
    const payload: Record<string, unknown> = {};

    if (this.filters.value.filter) {
      payload['description'] = { like: this.filters.value.filter };
    }

    if (this.filters.value.account) {
      payload['accountId'] = { eq: this.filters.value.account };
    }

    if (this.filters.value.type) {
      payload['type'] = { eq: this.filters.value.type };
    }

    const range = this.filters.value.dateRange;
    if (range?.start && range?.end) {
      payload['date'] = { between: [range.start, range.end] };
    } else if (range?.start) {
      payload['date'] = { gte: range.start };
    } else if (range?.end) {
      payload['date'] = { lte: range.end };
    }

    const filters = Object.keys(payload).length > 0 ? payload : undefined;
    this.transactionsService.getAll(filters).then(response => {
      this.transactions.set(response);
    });
  }

  delete(transaction: Transaction): void {
    this.transactionsService.delete(transaction.id).then(() => {
      this.transactionsService.updated.emit();
    });
  }

  getCategory(transaction: Transaction): Category | undefined {
    return this.categories().find(category => category.id === transaction.categoryId);
  }

  getCategoryName(transaction: Transaction): string {
    return this.getCategory(transaction)?.name ?? 'Sem categoria';
  }

  getAccountName(transaction: Transaction): string {
    return this.accounts().find(account => account.id === transaction.accountId)?.name ?? 'Sem conta';
  }

  signedAmount(transaction: Transaction): number {
    if (transaction.type === 'debit') return -Math.abs(transaction.amount);
    return Math.abs(transaction.amount);
  }

  isIncome(transaction: Transaction): boolean {
    return this.signedAmount(transaction) > 0;
  }

  typeLabel(transaction: Transaction): string {
    const labels: Record<Transaction['type'], string> = {
      credit: 'Receita',
      debit: 'Despesa',
      transfer: 'Transferencia',
    };

    return labels[transaction.type];
  }

  private loadReferences(): void {
    Promise.all([
      this.accountsService.getAll(),
      this.categoriesService.getAll(),
    ]).then(([accounts, categories]) => {
      this.accounts.set(accounts);
      this.categories.set(categories);
      this.accountOptions.set([
        { value: '', label: 'Todas' },
        ...accounts.map(account => ({
          value: account.id,
          label: account.name,
          icon: account.icon ?? undefined,
        })),
      ]);
    });
  }
}
