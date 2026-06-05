import { OfxDiagnostic } from 'ofx-data-extractor';
import { ImportedTransaction } from './transaction.model';

export interface OfxParseResult {
  fileName: string;
  transactions: ImportedTransaction[];
  currency: string | null;

  institution: {
    bankName: string;
    bankId: string | null;
  };

  account: {
    bankId: string | null;
    accountNumber: string | null;
    accountType: string | null;
  };

  periodStart: Date;
  periodEnd: Date;
  statementPeriod: string;
  initialBalance: number | null;
  finalBalance: number | null;
  balanceDate: Date | null;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  isComplete: boolean;
  warnings: OfxDiagnostic[];
}
