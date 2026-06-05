export type AccountReceivableStatus = 'pending' | 'received' | 'overdue' | 'canceled';

export interface AccountReceivable {
  id: string;
  description: string;
  payer: string;
  amount: number;
  dueDate: string;
  receivedAt: string | null;
  status: AccountReceivableStatus;
  accountId: string | null;
  categoryId: string | null;
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
  accountId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
