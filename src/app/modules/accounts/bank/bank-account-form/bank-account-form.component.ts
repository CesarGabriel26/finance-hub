import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account, AccountType, NewAccount } from '../../../../models';
import { SelectComponent } from '../../../../components/select/select.component';
import { InputComponent } from '../../../../components/input/input.component';
import { ColorPickerComponent } from '../../../../components/color-picker/color-picker.component';
import { IconPickerComponent } from '../../../../components/icon-picker/icon-picker.component';
import { AccountsService } from '../../../../services/accounts.service';
import { ModalService } from '../../../../services/modal.service';
import { BankService } from '../../../../services/banks.service';

@Component({
  selector: 'app-bank-account-form',
  imports: [ReactiveFormsModule, FormsModule, SelectComponent, InputComponent, ColorPickerComponent, IconPickerComponent],
  templateUrl: './bank-account-form.component.html',
  styleUrl: './bank-account-form.component.css',
})
export class BankAccountFormComponent implements OnInit {
  @Input() account?: Account;


  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
    type: new FormControl<AccountType>('checking', [Validators.required]),
    balance: new FormControl<number>(0),
    color: new FormControl<string>('#7e7d7dff', [Validators.required]),
    icon: new FormControl<string>('account_balance', [Validators.required]),
    bankCode: new FormControl<string>('', [Validators.required]),
    accountNumber: new FormControl<string>(''),
  })

  constructor(
    private accountService: AccountsService,
    private modalService: ModalService,
    public bankService: BankService
  ) { }

  ngOnInit(): void {
    if (this.account) {
      this.form.patchValue({
        name: this.account.name,
        type: this.account.type,
        balance: this.account.balance,
        color: this.account.color,
        icon: this.account.icon,
        bankCode: this.account.bankCode,
        accountNumber: this.account.accountNumber,
      })
    }
  }

  submit(event: Event) {
    event.preventDefault();

    this.form.markAllAsTouched()
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewAccount = {
      ...raw,
      name: raw.name?.trim() ?? '',
      type: raw.type ?? 'checking',
      bankCode: raw.bankCode ?? '',
      accountNumber: raw.accountNumber?.trim() ?? '',
    };
    
    const saveAccount = this.account?.id
      ? this.accountService.update(this.account.id, payload)
      : this.accountService.insert(payload);

    saveAccount.then(() => {
      this.accountService.updated.emit();
      this.modalService.close();
    })
  }
}
