import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../../components/data-table/data-table.component';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { Account, AccountPayable, Category } from '../../../../models';
import { AccountsPayableService } from '../../../../services/accounts-payable.service';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
import { TransactionsService } from '../../../../services/transactions.service';
import {
  buildScheduleQuery,
  formatScheduleDate,
  nextPayablePayload,
  payableStatusClass,
  payableStatusLabel,
  todayKey,
} from '../../accounts-schedule.utils';
import { AccountPayableFormComponent } from '../account-payable-form/account-payable-form.component';

@Component({
  selector: 'app-accounts-payable',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    DataTableComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './accounts-payable.component.html',
  styleUrl: './accounts-payable.component.css',
})
export class AccountsPayableComponent implements OnInit {
  payables = signal<AccountPayable[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);

  readonly payableColumns: DataTableColumn<AccountPayable>[] = [
    { key: 'description', label: 'Descricao' },
    { key: 'amount', label: 'Valor' },
    { key: 'dueDate', label: 'Vencimento' },
    { key: 'status', label: 'Status' },
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Paga' },
    { value: 'overdue', label: 'Vencida' },
    { value: 'canceled', label: 'Cancelada' },
  ];

  filters = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<string>('', { nonNullable: true }),
  });

  readonly menuItems: ContextMenuItem<AccountPayable>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: payable => this.openModal(payable),
    },
    {
      label: 'Marcar como paga',
      icon: 'check_circle',
      isVisible: payable => payable.status !== 'paid',
      onClick: payable => this.markAsPaid(payable),
    },
    { isSeparator: true },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: payable => this.delete(payable),
    },
  ];

  constructor(
    private payableService: AccountsPayableService,
    private accountService: AccountsService,
    private categoryService: CategoriesService,
    private modalService: ModalService,
    private transactionsService: TransactionsService,
  ) { }

  ngOnInit(): void {
    this.loadReferences();
    this.search();

    this.payableService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
      )
      .subscribe(() => this.search());
  }

  identifyPayable(row: AccountPayable): string {
    return row.id;
  }

  openModal(payable?: AccountPayable): void {
    this.modalService.open(AccountPayableFormComponent, { payable });
  }

  search(): void {
    const payload = buildScheduleQuery(this.filters.value);

    this.payableService.getAll(payload).then(response => {
      this.payables.set(response);
    });
  }

  async markAsPaid(payable: AccountPayable): Promise<void> {
    const paidAt = payable.paidAt ?? todayKey();
    let settlementTransactionId = payable.settlementTransactionId ?? null;

    if (payable.accountId && !settlementTransactionId) {
      const inserted = await this.transactionsService.insert({
        accountId: payable.accountId,
        categoryId: payable.categoryId,
        description: payable.description,
        originalDescription: 'Baixa de conta a pagar',
        amount: Math.abs(payable.amount),
        type: 'debit',
        date: paidAt,
        ignored: false,
      });
      settlementTransactionId = inserted[0]?.id ?? null;

      const account = await this.accountService.getById(payable.accountId);
      if (account) {
        await this.accountService.update(account.id, {
          balance: (account.balance ?? 0) - Math.abs(payable.amount),
        });
        this.accountService.updated.emit();
      }
    }

    await this.payableService.update(payable.id, {
      status: 'paid',
      paidAt,
      settlementTransactionId,
    });
    await this.createNextPayableIfNeeded(payable);

    this.transactionsService.updated.emit();
    this.payableService.updated.emit();
  }

  delete(payable: AccountPayable): void {
    this.payableService
      .delete(payable.id)
      .then(() => this.payableService.updated.emit());
  }

  getAccountName(accountId: string | null): string {
    return this.accounts().find(account => account.id === accountId)?.name ?? 'Sem conta';
  }

  getCategoryName(categoryId: string | null): string {
    return this.categories().find(category => category.id === categoryId)?.name ?? 'Sem categoria';
  }

  getStatusLabel(payable: AccountPayable): string {
    return payableStatusLabel(payable);
  }

  getStatusClass(payable: AccountPayable): string {
    return payableStatusClass(payable);
  }

  formatDate(value: string | null): string {
    return formatScheduleDate(value);
  }

  private async createNextPayableIfNeeded(payable: AccountPayable): Promise<void> {
    const next = nextPayablePayload(payable);
    if (!next) return;

    await this.payableService.insert(next);
  }

  private loadReferences(): void {
    Promise.all([
      this.accountService.getAll(),
      this.categoryService.getAll({ type: { eq: 'expense' } } as any),
    ]).then(([accounts, categories]) => {
      this.accounts.set(accounts);
      this.categories.set(categories);
    });
  }

}
