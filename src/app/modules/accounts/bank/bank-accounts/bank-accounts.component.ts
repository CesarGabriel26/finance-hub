import { Component, OnInit, signal } from '@angular/core';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../../components/context-menu/context-menu.component';
import { Account, AccountType } from '../../../../models';
import { DataTableColumn, DataTableComponent } from '../../../../components/data-table/data-table.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountsService } from '../../../../services/accounts.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SelectComponent, SelectOption } from '../../../../components/select/select.component';
import { BankAccountFormComponent } from '../bank-account-form/bank-account-form.component';
import { ModalService } from '../../../../services/modal.service';
import { InputComponent } from '../../../../components/input/input.component';
import { CurrencyPipe } from '@angular/common';
import { BankService } from '../../../../services/banks.service';

@Component({
  selector: 'app-bank-accounts',
  imports: [ContextMenuComponent, CurrencyPipe, ContextMenuTriggerDirective, DataTableComponent, ReactiveFormsModule, FormsModule, SelectComponent, InputComponent],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.css',
})
export class BankAccountsComponent implements OnInit {
  accounts = signal<Account[]>([])
  accountsColumns: DataTableColumn<Account>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'balance', label: 'Saldo Atual' },
    { key: 'bankCode', label: 'Código do Banco' },
    { key: 'accountNumber', label: 'Conta' },
  ]

  ACCOUNT_TYPES: SelectOption[] = [
    { value: '', label: 'Todas' },
    { value: 'checking', label: 'Conta Corrente' },
    { value: 'savings', label: 'Poupança' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'investment', label: 'Investimento' },
  ] as const;

  filters = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    type: new FormControl<string>('', { nonNullable: true }),
  })

  readonly menuItems: ContextMenuItem[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (acc: Account) => this.openModal(acc),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: (acc: Account) => this.accountService.delete(acc.id).then(() => { this.accountService.updated.emit(); }),
    },
  ]

  constructor(
    private accountService: AccountsService,
    private modalService: ModalService,
    public bankService: BankService
  ) { }

  identifyAccount(acc: Account) {
    return acc.id
  }

  openModal(acc?: Account) {
    this.modalService.open(BankAccountFormComponent, {
      account: acc
    });
  }

  getAccLabel(accType: AccountType) {
    return this.ACCOUNT_TYPES.find(acc => acc.value === accType)?.label
  }

  ngOnInit(): void {
    this.search();

    this.accountService.updated.subscribe(() => this.search());

    this.filters.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => this.search());
  }

  search() {
    let payload: any = {};

    if (this.filters.value.name !== '') {
      payload = {
        name: {
          like: this.filters.value.name
        }
      };
    }

    if (this.filters.value.type !== '') {
      payload = {
        ...payload,
        type: {
          eq: this.filters.value.type
        }
      };
    }

    this.accountService.getAll(payload).then(response => {
      this.accounts.set(response);
    });
  }
}
