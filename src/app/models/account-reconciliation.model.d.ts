export type AccountReconciliationStatus = 'pending' | 'matched' | 'difference';

export interface AccountReconciliation {
  id: string;
  accountId: string;
  period: string;
  systemBalance: number;
  statementBalance: number | null;
  realBalance: number;
  difference: number;
  status: AccountReconciliationStatus;
  notes: string | null;
  reconciledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewAccountReconciliation {
  id?: string;
  accountId: string;
  period: string;
  systemBalance?: number;
  statementBalance?: number | null;
  realBalance: number;
  difference?: number;
  status?: AccountReconciliationStatus;
  notes?: string | null;
  reconciledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
