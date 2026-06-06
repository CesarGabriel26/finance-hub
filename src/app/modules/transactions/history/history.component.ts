import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DateRange, DateRangeInputComponent } from '../../../components/date-range-input/date-range-input.component';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { Account, Category, Transaction } from '../../../models';
import { AccountsService } from '../../../services/accounts.service';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { TransactionsService } from '../../../services/transactions.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import {
  TransactionDayGroup,
  buildTransactionHistoryQuery,
  isIncome,
  signedAmount,
  totalExpense,
  totalIncome,
  transactionColor,
  transactionGroups,
  transactionIcon,
  transactionTypeLabel,
} from './history.utils';

@Component({
  selector: 'app-history.component',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    SelectComponent,
    DateRangeInputComponent,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    ReactiveFormsModule,
    InputComponent,
    RouterLink,
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

  openModal(transaction?: Transaction): void {
    this.modalService.open(TransactionFormComponent, { transaction });
  }

  search(): void {
    const filters = buildTransactionHistoryQuery(this.filters.value);
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
    return signedAmount(transaction);
  }

  isIncome(transaction: Transaction): boolean {
    return isIncome(transaction);
  }

  typeLabel(transaction: Transaction): string {
    return transactionTypeLabel(transaction);
  }

  transactionGroups(): TransactionDayGroup[] {
    return transactionGroups(this.transactions());
  }

  totalIncome(): number {
    return totalIncome(this.transactions());
  }

  totalExpense(): number {
    return totalExpense(this.transactions());
  }

  balance(): number {
    return this.totalIncome() - this.totalExpense();
  }

  transactionIcon(transaction: Transaction): string {
    return transactionIcon(transaction, this.getCategory(transaction));
  }

  transactionColor(transaction: Transaction): string {
    return transactionColor(transaction, this.getCategory(transaction));
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
