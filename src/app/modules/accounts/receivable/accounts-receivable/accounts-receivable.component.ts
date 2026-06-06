import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../../components/data-table/data-table.component';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { Account, AccountReceivable, Category } from '../../../../models';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
import { AccountReceivableFormComponent } from '../account-receivable-form/account-receivable-form.component';
import { AccountsReceivableService } from '../../../../services/accounts-receivable.service';
import { TransactionsService } from '../../../../services/transactions.service';
import {
  buildScheduleQuery,
  formatScheduleDate,
  nextReceivablePayload,
  receivableStatusClass,
  receivableStatusLabel,
  todayKey,
} from '../../accounts-schedule.utils';

@Component({
  selector: 'app-accounts-receivable',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    DataTableComponent,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './accounts-receivable.component.html',
  styleUrl: './accounts-receivable.component.css',
})
export class AccountsReceivableComponent implements OnInit {
  receivables = signal<AccountReceivable[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);

  readonly receivableColumns: DataTableColumn<AccountReceivable>[] = [
    { key: 'description', label: 'Descricao' },
    { key: 'amount', label: 'Valor' },
    { key: 'dueDate', label: 'Vencimento' },
    { key: 'status', label: 'Status' },
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'received', label: 'Recebida' },
    { value: 'overdue', label: 'Vencida' },
    { value: 'canceled', label: 'Cancelada' },
  ];

  filters = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<string>('', { nonNullable: true }),
  });

  readonly menuItems: ContextMenuItem<AccountReceivable>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: receivable => this.openModal(receivable),
    },
    {
      label: 'Marcar como recebida',
      icon: 'check_circle',
      isVisible: receivable => receivable.status !== 'received',
      onClick: receivable => this.markAsReceived(receivable),
    },
    { isSeparator: true },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: receivable => this.delete(receivable),
    },
  ];

  constructor(
    private receivableService: AccountsReceivableService,
    private accountService: AccountsService,
    private categoryService: CategoriesService,
    private modalService: ModalService,
    private transactionsService: TransactionsService,
  ) { }

  ngOnInit(): void {
    this.loadReferences();
    this.search();

    this.receivableService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
      )
      .subscribe(() => this.search());
  }

  identifyReceivable(row: AccountReceivable): string {
    return row.id;
  }

  openModal(receivable?: AccountReceivable): void {
    this.modalService.open(AccountReceivableFormComponent, { receivable });
  }

  search(): void {
    const payload = buildScheduleQuery(this.filters.value);

    this.receivableService.getAll(payload).then(response => {
      this.receivables.set(response);
    });
  }

  async markAsReceived(receivable: AccountReceivable): Promise<void> {
    const receivedAt = receivable.receivedAt ?? todayKey();
    let settlementTransactionId = receivable.settlementTransactionId ?? null;

    if (receivable.accountId && !settlementTransactionId) {
      const inserted = await this.transactionsService.insert({
        accountId: receivable.accountId,
        categoryId: receivable.categoryId,
        description: receivable.description,
        originalDescription: 'Baixa de conta a receber',
        amount: Math.abs(receivable.amount),
        type: 'credit',
        date: receivedAt,
        ignored: false,
      });
      settlementTransactionId = inserted[0]?.id ?? null;

      const account = await this.accountService.getById(receivable.accountId);
      if (account) {
        await this.accountService.update(account.id, {
          balance: (account.balance ?? 0) + Math.abs(receivable.amount),
        });
        this.accountService.updated.emit();
      }
    }

    await this.receivableService.update(receivable.id, {
      status: 'received',
      receivedAt,
      settlementTransactionId,
    });
    await this.createNextReceivableIfNeeded(receivable);

    this.transactionsService.updated.emit();
    this.receivableService.updated.emit();
  }

  delete(receivable: AccountReceivable): void {
    this.receivableService
      .delete(receivable.id)
      .then(() => this.receivableService.updated.emit());
  }

  getAccountName(accountId: string | null): string {
    return this.accounts().find(account => account.id === accountId)?.name ?? 'Sem conta';
  }

  getCategoryName(categoryId: string | null): string {
    return this.categories().find(category => category.id === categoryId)?.name ?? 'Sem categoria';
  }

  getStatusLabel(receivable: AccountReceivable): string {
    return receivableStatusLabel(receivable);
  }

  getStatusClass(receivable: AccountReceivable): string {
    return receivableStatusClass(receivable);
  }

  formatDate(value: string | null): string {
    return formatScheduleDate(value);
  }

  private async createNextReceivableIfNeeded(receivable: AccountReceivable): Promise<void> {
    const next = nextReceivablePayload(receivable);
    if (!next) return;

    await this.receivableService.insert(next);
  }

  private loadReferences(): void {
    Promise.all([
      this.accountService.getAll(),
      this.categoryService.getAll({ type: { eq: 'income' } } as any),
    ]).then(([accounts, categories]) => {
      this.accounts.set(accounts);
      this.categories.set(categories);
    });
  }

}
