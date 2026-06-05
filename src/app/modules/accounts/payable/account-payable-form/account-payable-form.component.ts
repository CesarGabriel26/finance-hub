import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AccountPayable,
  AccountPayableStatus,
  NewAccountPayable,
} from '../../../../models/account-payable.model';
import { AccountsPayableService } from '../../../../services/accounts-payable.service';
import { AccountsService } from '../../../../services/accounts.service';
import { CategoriesService } from '../../../../services/categories.service';
import { ModalService } from '../../../../services/modal.service';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';

@Component({
  selector: 'app-account-payable-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './account-payable-form.component.html',
  styleUrl: './account-payable-form.component.css',
})
export class AccountPayableFormComponent implements OnInit {
  @Input() payable?: AccountPayable;

  accountOptions = signal<SelectOption[]>([{ value: '', label: 'Sem conta vinculada' }]);
  categoryOptions = signal<SelectOption[]>([{ value: '', label: 'Sem categoria' }]);

  readonly statusOptions: SelectOption[] = [
    { value: 'pending', label: 'Pendente' },
    { value: 'paid', label: 'Paga' },
    { value: 'overdue', label: 'Vencida' },
    { value: 'canceled', label: 'Cancelada' },
  ];

  form = new FormGroup({
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    payee: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    dueDate: new FormControl<string>(this.today(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paidAt: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<AccountPayableStatus>('pending', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    accountId: new FormControl<string>('', { nonNullable: true }),
    categoryId: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private payableService: AccountsPayableService,
    private accountService: AccountsService,
    private categoryService: CategoriesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    if (this.payable) {
      this.form.patchValue({
        description: this.payable.description,
        payee: this.payable.payee,
        amount: this.payable.amount,
        dueDate: this.payable.dueDate,
        paidAt: this.payable.paidAt ?? '',
        status: this.payable.status,
        accountId: this.payable.accountId ?? '',
        categoryId: this.payable.categoryId ?? '',
        notes: this.payable.notes ?? '',
      });
    }
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewAccountPayable = {
      description: raw.description.trim(),
      payee: raw.payee.trim(),
      amount: raw.amount,
      dueDate: raw.dueDate,
      paidAt: raw.paidAt || null,
      status: raw.status,
      accountId: raw.accountId || null,
      categoryId: raw.categoryId || null,
      notes: raw.notes.trim() || null,
    };

    if (payload.status === 'paid' && !payload.paidAt) {
      payload.paidAt = this.today();
    }

    const save = this.payable?.id
      ? this.payableService.update(this.payable.id, payload)
      : this.payableService.insert(payload);

    save.then(() => {
      this.payableService.updated.emit();
      this.modalService.close();
    });
  }

  private loadOptions(): void {
    Promise.all([
      this.accountService.getAll(),
      this.categoryService.getAll({ type: { eq: 'expense' } } as any),
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
