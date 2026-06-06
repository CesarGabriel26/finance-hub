import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { InputComponent } from '../../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { Account, AccountType } from '../../../../models';
import { AccountsService } from '../../../../services/accounts.service';
import { BankService } from '../../../../services/banks.service';
import { ModalService } from '../../../../services/modal.service';
import { BankAccountFormComponent } from '../bank-account-form/bank-account-form.component';

@Component({
  selector: 'app-bank-accounts',
  imports: [
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    CurrencyPipe,
    FormsModule,
    InputComponent,
    ReactiveFormsModule,
    RouterLink,
    SelectComponent,
  ],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.css',
})
export class BankAccountsComponent implements OnInit {
  accounts = signal<Account[]>([]);

  readonly ACCOUNT_TYPES: SelectOption[] = [
    { value: '', label: 'Todas' },
    { value: 'checking', label: 'Conta corrente' },
    { value: 'savings', label: 'Poupanca' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'investment', label: 'Investimento' },
  ];

  filters = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    type: new FormControl<string>('', { nonNullable: true }),
  });

  readonly menuItems: ContextMenuItem<Account>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: account => this.openModal(account),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: account => this.accountService.delete(account.id).then(() => {
        this.accountService.updated.emit();
      }),
    },
  ];

  constructor(
    private accountService: AccountsService,
    private modalService: ModalService,
    public bankService: BankService,
  ) {}

  openModal(account?: Account): void {
    this.modalService.open(BankAccountFormComponent, { account });
  }

  getAccLabel(accountType: AccountType): string {
    return this.ACCOUNT_TYPES.find(account => account.value === accountType)?.label ?? 'Conta';
  }

  totalBalance(): number {
    return this.accounts().reduce((sum, account) => sum + (account.balance ?? 0), 0);
  }

  accountCountLabel(): string {
    const count = this.accounts().length;
    return count === 1 ? '1 conta cadastrada' : `${count} contas cadastradas`;
  }

  bankName(account: Account): string {
    return this.bankService.getBankByCode(account.bankCode)?.name ?? 'Banco nao informado';
  }

  ngOnInit(): void {
    this.search();
    this.accountService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.search());
  }

  search(): void {
    let payload: any = {};

    if (this.filters.value.name !== '') {
      payload = {
        name: {
          like: this.filters.value.name,
        },
      };
    }

    if (this.filters.value.type !== '') {
      payload = {
        ...payload,
        type: {
          eq: this.filters.value.type,
        },
      };
    }

    this.accountService.getAll(payload).then(response => {
      this.accounts.set(response);
    });
  }
}
