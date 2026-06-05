import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/input/input.component';
import { Account, AccountReconciliation, AccountStatementBalance } from '../../../models';
import { AccountReconciliationsService } from '../../../services/account-reconciliations.service';
import { AccountStatementBalancesService } from '../../../services/account-statement-balances.service';
import { AccountsService } from '../../../services/accounts.service';

@Component({
  selector: 'app-account-reconciliation',
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, InputComponent],
  templateUrl: './account-reconciliation.component.html',
  styleUrl: './account-reconciliation.component.css',
})
export class AccountReconciliationComponent implements OnInit {
  accounts = signal<Account[]>([]);
  statementBalances = signal<AccountStatementBalance[]>([]);
  reconciliations = signal<AccountReconciliation[]>([]);
  realBalances = signal<Record<string, number>>({});
  notes = signal<Record<string, string>>({});
  message = signal('');

  filters = new FormGroup({
    period: new FormControl<string>(new Date().toISOString().slice(0, 7), { nonNullable: true }),
  });

  constructor(
    private accountsService: AccountsService,
    private statementBalancesService: AccountStatementBalancesService,
    private reconciliationsService: AccountReconciliationsService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.subscribe(() => this.loadPeriodData());
  }

  statementBalance(account: Account): number | null {
    return this.statementBalances().find(item => item.accountId === account.id)?.finalBalance ?? null;
  }

  reconciliation(account: Account): AccountReconciliation | undefined {
    return this.reconciliations().find(item => item.accountId === account.id);
  }

  realBalance(account: Account): number {
    return this.realBalances()[account.id] ?? this.reconciliation(account)?.realBalance ?? Number(account.balance ?? 0);
  }

  difference(account: Account): number {
    return this.realBalance(account) - Number(account.balance ?? 0);
  }

  differenceCount(): number {
    return this.reconciliations().filter(item => item.status === 'difference').length;
  }

  setRealBalance(accountId: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) || 0;
    this.realBalances.update(current => ({ ...current, [accountId]: value }));
  }

  setNotes(accountId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.notes.update(current => ({ ...current, [accountId]: value }));
  }

  save(account: Account): void {
    const difference = this.difference(account);

    this.reconciliationsService.upsert({
      accountId: account.id,
      period: this.filters.controls.period.value,
      systemBalance: Number(account.balance ?? 0),
      statementBalance: this.statementBalance(account),
      realBalance: this.realBalance(account),
      difference,
      status: Math.abs(difference) < 0.01 ? 'matched' : 'difference',
      notes: this.notes()[account.id] || null,
      reconciledAt: new Date().toISOString(),
    }).then(() => {
      this.message.set(`Conferido: ${account.name}`);
      this.reconciliationsService.updated.emit();
      this.loadPeriodData();
    });
  }

  private load(): void {
    this.accountsService.getAll().then(accounts => this.accounts.set(accounts));
    this.loadPeriodData();
  }

  private loadPeriodData(): void {
    const period = this.filters.controls.period.value;

    Promise.all([
      this.statementBalancesService.getAll({ period: { eq: period } }),
      this.reconciliationsService.getAll(period),
    ]).then(([balances, reconciliations]) => {
      this.statementBalances.set(balances);
      this.reconciliations.set(reconciliations);

      const realBalances: Record<string, number> = {};
      const notes: Record<string, string> = {};
      for (const reconciliation of reconciliations) {
        realBalances[reconciliation.accountId] = reconciliation.realBalance;
        notes[reconciliation.accountId] = reconciliation.notes ?? '';
      }
      this.realBalances.set(realBalances);
      this.notes.set(notes);
    });
  }
}
