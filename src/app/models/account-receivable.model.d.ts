export type AccountReceivableStatus = 'pending' | 'received' | 'overdue' | 'canceled';
export type AccountReceivableRecurrenceClassification = 'fixed' | 'variable';

export interface AccountReceivable {
  id: string;
  description: string;
  payer: string;
  amount: number;
  dueDate: string;
  receivedAt: string | null;
  status: AccountReceivableStatus;
  isRecurring: boolean;
  recurrenceClassification: AccountReceivableRecurrenceClassification | null;
  totalInstallments: number;
  currentInstallment: number;
  accountId: string | null;
  categoryId: string | null;
  settlementTransactionId: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewAccountReceivable {
  id?: string;
  description: string;
  payer?: string;
  amount: number;
  dueDate: string;
  receivedAt?: string | null;
  status?: AccountReceivableStatus;
  isRecurring?: boolean;
  recurrenceClassification?: AccountReceivableRecurrenceClassification | null;
  totalInstallments?: number;
  currentInstallment?: number;
  accountId?: string | null;
  categoryId?: string | null;
  settlementTransactionId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
