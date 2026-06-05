import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account, Category, NewTransaction, Transaction, TransactionType } from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { AccountsService } from '../../../services/accounts.service';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { TransactionsService } from '../../../services/transactions.service';

@Component({
  selector: 'app-transaction-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css',
})
export class TransactionFormComponent implements OnInit {
  @Input() transaction?: Transaction;

  accountOptions = signal<SelectOption[]>([]);
  categoryOptions = signal<SelectOption[]>([{ value: '', label: 'Sem categoria' }]);
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);

  form = new FormGroup({
    accountId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    type: new FormControl<TransactionType>('debit', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    date: new FormControl<string>(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    categoryId: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private transactionsService: TransactionsService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    if (this.transaction) {
      this.form.patchValue({
        accountId: this.transaction.accountId,
        description: this.transaction.description,
        type: this.transaction.type,
        amount: Math.abs(this.transaction.amount),
        date: this.transaction.date,
        categoryId: this.transaction.categoryId ?? '',
      });
    }
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewTransaction = {
      accountId: raw.accountId,
      description: raw.description.trim(),
      amount: Number(raw.amount),
      type: raw.type,
      date: raw.date,
      categoryId: raw.categoryId || null,
      ignored: false,
    };

    const save = this.transaction?.id
      ? this.transactionsService.update(this.transaction.id, payload)
      : this.transactionsService.insert(payload);

    save.then(() => {
      this.transactionsService.updated.emit();
      this.modalService.close();
    });
  }

  private loadOptions(): void {
    Promise.all([
      this.accountsService.getAll(),
      this.categoriesService.getAll(),
    ]).then(([accounts, categories]) => {
      this.accounts.set(accounts);
      this.categories.set(categories);

      this.accountOptions.set(accounts.map(account => ({
        value: account.id,
        label: account.name,
        icon: account.icon ?? undefined,
      })));

      this.categoryOptions.set([
        { value: '', label: 'Sem categoria' },
        ...categories.map(category => ({
          value: category.id,
          label: category.name,
          icon: category.icon ?? undefined,
        })),
      ]);

      if (!this.transaction && accounts[0]) {
        this.form.patchValue({ accountId: accounts[0].id });
      }
    });
  }
}
