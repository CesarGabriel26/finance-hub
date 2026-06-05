import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../../components/data-table/data-table.component';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { Account, AccountReceivable, AccountReceivableStatus, Category } from '../../../../models';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
import { AccountReceivableFormComponent } from '../account-receivable-form/account-receivable-form.component';
import { AccountsReceivableService } from '../../../../services/accounts-receivable.service';
import { TransactionsService } from '../../../../services/transactions.service';

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
    const payload: Record<string, unknown> = {};

    if (this.filters.value.description) {
      payload['description'] = { like: this.filters.value.description };
    }

    if (this.filters.value.status === 'overdue') {
      payload['or'] = [
        { status: { eq: 'overdue' } },
        {
          and: [
            { status: { eq: 'pending' } },
            { dueDate: { lt: this.today() } },
          ],
        },
      ];
    } else if (this.filters.value.status) {
      payload['status'] = { eq: this.filters.value.status };
    }

    this.receivableService.getAll(payload).then(response => {
      this.receivables.set(response);
    });
  }

  async markAsReceived(receivable: AccountReceivable): Promise<void> {
    const receivedAt = receivable.receivedAt ?? this.today();
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
    const labels: Record<AccountReceivableStatus, string> = {
      pending: 'Pendente',
      received: 'Recebida',
      overdue: 'Vencida',
      canceled: 'Cancelada',
    };

    return labels[this.resolveStatus(receivable)];
  }

  getStatusClass(receivable: AccountReceivable): string {
    const status = this.resolveStatus(receivable);

    const classes: Record<AccountReceivableStatus, string> = {
      pending: 'bg-amber-500/10 text-amber-700',
      received: 'bg-emerald-500/10 text-emerald-700',
      overdue: 'bg-red-500/10 text-red-700',
      canceled: 'bg-slate-500/10 text-slate-600',
    };

    return classes[status];
  }

  formatDate(value: string | null): string {
    if (!value) return '-';

    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  private resolveStatus(receivable: AccountReceivable): AccountReceivableStatus {
    if (receivable.status === 'pending' && receivable.dueDate.slice(0, 10) < this.today()) {
      return 'overdue';
    }

    return receivable.status;
  }

  private async createNextReceivableIfNeeded(receivable: AccountReceivable): Promise<void> {
    if (!receivable.isRecurring) return;

    const hasNextInstallment = receivable.currentInstallment < receivable.totalInstallments;
    const isOpenRecurring = receivable.totalInstallments <= 1;
    if (!hasNextInstallment && !isOpenRecurring) return;

    await this.receivableService.insert({
      description: receivable.description,
      payer: receivable.payer,
      amount: receivable.amount,
      dueDate: this.addOneMonth(receivable.dueDate),
      status: 'pending',
      isRecurring: receivable.isRecurring,
      recurrenceClassification: receivable.recurrenceClassification,
      totalInstallments: isOpenRecurring ? 1 : receivable.totalInstallments,
      currentInstallment: isOpenRecurring ? 1 : receivable.currentInstallment + 1,
      accountId: receivable.accountId,
      categoryId: receivable.categoryId,
      notes: receivable.notes,
    });
  }

  private addOneMonth(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(year, month - 1, day || 1, 12);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
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

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
