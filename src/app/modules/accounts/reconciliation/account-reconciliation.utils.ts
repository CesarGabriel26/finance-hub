import { FormControl, FormGroup } from '@angular/forms';
import type {
  Account,
  AccountReconciliation,
  AccountStatementBalance,
  NewAccountReconciliation,
} from '../../../models';

export type ReconciliationFiltersForm = FormGroup<{
  period: FormControl<string>;
}>;

export interface ReconciliationDraftState {
  realBalances: Record<string, number>;
  notes: Record<string, string>;
}

export function createReconciliationFiltersForm(): ReconciliationFiltersForm {
  return new FormGroup({
    period: new FormControl(new Date().toISOString().slice(0, 7), { nonNullable: true }),
  });
}

export function statementBalanceForAccount(
  account: Account,
  statementBalances: AccountStatementBalance[],
): number | null {
  return statementBalances.find(item => item.accountId === account.id)?.finalBalance ?? null;
}

export function reconciliationForAccount(
  account: Account,
  reconciliations: AccountReconciliation[],
): AccountReconciliation | undefined {
  return reconciliations.find(item => item.accountId === account.id);
}

export function realBalanceForAccount(
  account: Account,
  realBalances: Record<string, number>,
  reconciliation?: AccountReconciliation,
): number {
  return realBalances[account.id] ?? reconciliation?.realBalance ?? Number(account.balance ?? 0);
}

export function differenceForAccount(
  account: Account,
  realBalance: number,
): number {
  return realBalance - Number(account.balance ?? 0);
}

export function reconciliationDifferenceCount(reconciliations: AccountReconciliation[]): number {
  return reconciliations.filter(item => item.status === 'difference').length;
}

export function draftStateFromReconciliations(
  reconciliations: AccountReconciliation[],
): ReconciliationDraftState {
  return reconciliations.reduce<ReconciliationDraftState>(
    (state, reconciliation) => ({
      realBalances: {
        ...state.realBalances,
        [reconciliation.accountId]: reconciliation.realBalance,
      },
      notes: {
        ...state.notes,
        [reconciliation.accountId]: reconciliation.notes ?? '',
      },
    }),
    { realBalances: {}, notes: {} },
  );
}

export function buildReconciliationPayload(params: {
  account: Account;
  period: string;
  statementBalance: number | null;
  realBalance: number;
  difference: number;
  notes: string | null;
}): NewAccountReconciliation {
  return {
    accountId: params.account.id,
    period: params.period,
    systemBalance: Number(params.account.balance ?? 0),
    statementBalance: params.statementBalance,
    realBalance: params.realBalance,
    difference: params.difference,
    status: Math.abs(params.difference) < 0.01 ? 'matched' : 'difference',
    notes: params.notes,
    reconciledAt: new Date().toISOString(),
  };
}
