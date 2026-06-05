import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AccountReceivable,
  AccountReceivableStatus,
  NewAccountReceivable,
} from '../../../../models/account-receivable.model';
import { AccountsReceivableService } from '../../../../services/accounts-receivable.service';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';

@Component({
  selector: 'app-account-receivable-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './account-receivable-form.component.html',
  styleUrl: './account-receivable-form.component.css',
})
export class AccountReceivableFormComponent implements OnInit {
  @Input() receivable?: AccountReceivable;

  accountOptions = signal<SelectOption[]>([{ value: '', label: 'Sem conta vinculada' }]);
  categoryOptions = signal<SelectOption[]>([{ value: '', label: 'Sem categoria' }]);

  readonly statusOptions: SelectOption[] = [
    { value: 'pending', label: 'Pendente' },
    { value: 'received', label: 'Recebida' },
    { value: 'overdue', label: 'Vencida' },
    { value: 'canceled', label: 'Cancelada' },
  ];

  form = new FormGroup({
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    payer: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    dueDate: new FormControl<string>(this.today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    receivedAt: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<AccountReceivableStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isRecurring: new FormControl<boolean>(false, { nonNullable: true }),
    recurrenceClassification: new FormControl<'fixed' | 'variable'>('fixed', { nonNullable: true }),
    totalInstallments: new FormControl<number>(1, { nonNullable: true }),
    currentInstallment: new FormControl<number>(1, { nonNullable: true }),
    accountId: new FormControl<string>('', { nonNullable: true }),
    categoryId: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private receivableService: AccountsReceivableService,
    private accountService: AccountsService,
    private categoryService: CategoriesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    if (this.receivable) {
      this.form.patchValue({
        description: this.receivable.description,
        payer: this.receivable.payer,
        amount: this.receivable.amount,
        dueDate: this.receivable.dueDate,
        receivedAt: this.receivable.receivedAt ?? '',
        status: this.receivable.status,
        isRecurring: this.receivable.isRecurring,
        recurrenceClassification: this.receivable.recurrenceClassification ?? 'fixed',
        totalInstallments: this.receivable.totalInstallments,
        currentInstallment: this.receivable.currentInstallment,
        accountId: this.receivable.accountId ?? '',
        categoryId: this.receivable.categoryId ?? '',
        notes: this.receivable.notes ?? '',
      });
    }
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewAccountReceivable = {
      description: raw.description.trim(),
      payer: raw.payer.trim(),
      amount: raw.amount,
      dueDate: raw.dueDate,
      receivedAt: raw.receivedAt || null,
      status: raw.status,
      isRecurring: raw.isRecurring,
      recurrenceClassification: raw.isRecurring ? raw.recurrenceClassification : null,
      totalInstallments: Math.max(1, Number(raw.totalInstallments) || 1),
      currentInstallment: Math.max(1, Number(raw.currentInstallment) || 1),
      accountId: raw.accountId || null,
      categoryId: raw.categoryId || null,
      notes: raw.notes.trim() || null,
    };

    if (payload.status === 'received' && !payload.receivedAt) {
      payload.receivedAt = this.today();
    }

    const save = this.receivable?.id
      ? this.receivableService.update(this.receivable.id, payload)
      : this.receivableService.insert(payload);

    save.then(() => {
      this.receivableService.updated.emit();
      this.modalService.close();
    });
  }

  private loadOptions(): void {
    Promise.all([
      this.accountService.getAll(),
      this.categoryService.getAll({ type: { eq: 'income' } } as any),
    ]).then(([accounts, categories]) => {
      this.accountOptions.set([
        { value: '', label: 'Sem conta vinculada' },
        ...accounts.map(account => ({
          value: account.id,
          label: account.name,
          icon: account.icon ?? undefined,
        })),
      ]);

      this.categoryOptions.set([
        { value: '', label: 'Sem categoria' },
        ...categories.map(category => ({
          value: category.id,
          label: category.name,
          icon: category.icon ?? undefined,
        })),
      ]);
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
