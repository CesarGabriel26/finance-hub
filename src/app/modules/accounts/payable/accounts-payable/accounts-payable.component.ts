import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../../components/data-table/data-table.component';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { Account, AccountPayable, AccountPayableStatus, Category } from '../../../../models';
import { AccountsPayableService } from '../../../../services/accounts-payable.service';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
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

    this.payableService.getAll(payload).then(response => {
      this.payables.set(response);
    });
  }

  markAsPaid(payable: AccountPayable): void {
    this.payableService
      .update(payable.id, {
        status: 'paid',
        paidAt: payable.paidAt ?? this.today(),
      })
      .then(() => this.payableService.updated.emit());
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
    const labels: Record<AccountPayableStatus, string> = {
      pending: 'Pendente',
      paid: 'Paga',
      overdue: 'Vencida',
      canceled: 'Cancelada',
    };

    return labels[this.resolveStatus(payable)];
  }

  getStatusClass(payable: AccountPayable): string {
    const status = this.resolveStatus(payable);

    const classes: Record<AccountPayableStatus, string> = {
      pending: 'bg-amber-500/10 text-amber-700',
      paid: 'bg-emerald-500/10 text-emerald-700',
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

  private resolveStatus(payable: AccountPayable): AccountPayableStatus {
    if (payable.status === 'pending' && payable.dueDate.slice(0, 10) < this.today()) {
      return 'overdue';
    }

    return payable.status;
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

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
