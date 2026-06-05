export type AccountPayableStatus = 'pending' | 'paid' | 'overdue' | 'canceled';

export interface AccountPayable {
  id: string;
  description: string;
  payee: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: AccountPayableStatus;
  accountId: string | null;
  categoryId: string | null;
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
  accountId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
