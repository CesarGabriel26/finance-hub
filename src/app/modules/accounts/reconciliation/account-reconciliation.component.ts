import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/input/input.component';
import { Account, AccountReconciliation, AccountStatementBalance } from '../../../models';
import { AccountReconciliationsService } from '../../../services/account-reconciliations.service';
import { AccountStatementBalancesService } from '../../../services/account-statement-balances.service';
import { AccountsService } from '../../../services/accounts.service';
import {
  buildReconciliationPayload,
  createReconciliationFiltersForm,
  differenceForAccount,
  draftStateFromReconciliations,
  realBalanceForAccount,
  reconciliationDifferenceCount,
  reconciliationForAccount,
  statementBalanceForAccount,
} from './account-reconciliation.utils';

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

  filters = createReconciliationFiltersForm();

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
    return statementBalanceForAccount(account, this.statementBalances());
  }

  reconciliation(account: Account): AccountReconciliation | undefined {
    return reconciliationForAccount(account, this.reconciliations());
  }

  realBalance(account: Account): number {
    return realBalanceForAccount(account, this.realBalances(), this.reconciliation(account));
  }

  difference(account: Account): number {
    return differenceForAccount(account, this.realBalance(account));
  }

  differenceCount(): number {
    return reconciliationDifferenceCount(this.reconciliations());
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

    this.reconciliationsService.upsert(buildReconciliationPayload({
      account,
      period: this.filters.controls.period.value,
      statementBalance: this.statementBalance(account),
      realBalance: this.realBalance(account),
      difference,
      notes: this.notes()[account.id] || null,
    })).then(() => {
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

      const { realBalances, notes } = draftStateFromReconciliations(reconciliations);
      this.realBalances.set(realBalances);
      this.notes.set(notes);
    });
  }
}
