export interface AccountStatementBalance {
  id: string;
  accountId: string;
  period: string;
  statementStartDate: string | null;
  statementEndDate: string | null;
  initialBalance: number | null;
  finalBalance: number | null;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
  bankName: string | null;
  accountNumber: string | null;
  fileName: string | null;
  importedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewAccountStatementBalance {
  id?: string;
  accountId: string;
  period: string;
  statementStartDate?: string | null;
  statementEndDate?: string | null;
  initialBalance?: number | null;
  finalBalance?: number | null;
  totalCredits?: number;
  totalDebits?: number;
  netAmount?: number;
  transactionCount?: number;
  bankName?: string | null;
  accountNumber?: string | null;
  fileName?: string | null;
  importedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
