export type AccountPayableStatus = 'pending' | 'paid' | 'overdue' | 'canceled';
export type AccountPayableRecurrenceClassification = 'fixed' | 'variable';

export interface AccountPayable {
  id: string;
  description: string;
  payee: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: AccountPayableStatus;
  isRecurring: boolean;
  recurrenceClassification: AccountPayableRecurrenceClassification | null;
  totalInstallments: number;
  currentInstallment: number;
  accountId: string | null;
  categoryId: string | null;
  settlementTransactionId: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewAccountPayable {
  id?: string;
  description: string;
  payee?: string;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status?: AccountPayableStatus;
  isRecurring?: boolean;
  recurrenceClassification?: AccountPayableRecurrenceClassification | null;
  totalInstallments?: number;
  currentInstallment?: number;
  accountId?: string | null;
  categoryId?: string | null;
  settlementTransactionId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
