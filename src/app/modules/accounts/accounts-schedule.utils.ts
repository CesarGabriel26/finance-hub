import type {
  AccountPayable,
  AccountPayableStatus,
  AccountReceivable,
  AccountReceivableStatus,
  NewAccountPayable,
  NewAccountReceivable,
} from '../../models';

export interface ScheduleFilters {
  description?: string | null;
  status?: string | null;
}

export interface AccountPayableFormValue {
  description: string;
  payee: string;
  amount: number;
  dueDate: string;
  paidAt: string;
  status: AccountPayableStatus;
  isRecurring: boolean;
  recurrenceClassification: 'fixed' | 'variable';
  totalInstallments: number;
  currentInstallment: number;
  accountId: string;
  categoryId: string;
  notes: string;
}

export interface AccountReceivableFormValue {
  description: string;
  payer: string;
  amount: number;
  dueDate: string;
  receivedAt: string;
  status: AccountReceivableStatus;
  isRecurring: boolean;
  recurrenceClassification: 'fixed' | 'variable';
  totalInstallments: number;
  currentInstallment: number;
  accountId: string;
  categoryId: string;
  notes: string;
}

export function buildScheduleQuery(filters: ScheduleFilters): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (filters.description) {
    payload['description'] = { like: filters.description };
  }

  if (filters.status === 'overdue') {
    payload['or'] = [
      { status: { eq: 'overdue' } },
      {
        and: [
          { status: { eq: 'pending' } },
          { dueDate: { lt: todayKey() } },
        ],
      },
    ];
  } else if (filters.status) {
    payload['status'] = { eq: filters.status };
  }

  return payload;
}

export function resolvePayableStatus(payable: AccountPayable): AccountPayableStatus {
  if (payable.status === 'pending' && payable.dueDate.slice(0, 10) < todayKey()) {
    return 'overdue';
  }

  return payable.status;
}

export function resolveReceivableStatus(receivable: AccountReceivable): AccountReceivableStatus {
  if (receivable.status === 'pending' && receivable.dueDate.slice(0, 10) < todayKey()) {
    return 'overdue';
  }

  return receivable.status;
}

export function payableStatusLabel(payable: AccountPayable): string {
  const labels: Record<AccountPayableStatus, string> = {
    pending: 'Pendente',
    paid: 'Paga',
    overdue: 'Vencida',
    canceled: 'Cancelada',
  };

  return labels[resolvePayableStatus(payable)];
}

export function receivableStatusLabel(receivable: AccountReceivable): string {
  const labels: Record<AccountReceivableStatus, string> = {
    pending: 'Pendente',
    received: 'Recebida',
    overdue: 'Vencida',
    canceled: 'Cancelada',
  };

  return labels[resolveReceivableStatus(receivable)];
}

export function payableStatusClass(payable: AccountPayable): string {
  const classes: Record<AccountPayableStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-700',
    paid: 'bg-emerald-500/10 text-emerald-700',
    overdue: 'bg-red-500/10 text-red-700',
    canceled: 'bg-slate-500/10 text-slate-600',
  };

  return classes[resolvePayableStatus(payable)];
}

export function receivableStatusClass(receivable: AccountReceivable): string {
  const classes: Record<AccountReceivableStatus, string> = {
    pending: 'bg-amber-500/10 text-amber-700',
    received: 'bg-emerald-500/10 text-emerald-700',
    overdue: 'bg-red-500/10 text-red-700',
    canceled: 'bg-slate-500/10 text-slate-600',
  };

  return classes[resolveReceivableStatus(receivable)];
}

export function nextPayablePayload(payable: AccountPayable): NewAccountPayable | null {
  if (!payable.isRecurring) return null;

  const hasNextInstallment = payable.currentInstallment < payable.totalInstallments;
  const isOpenRecurring = payable.totalInstallments <= 1;
  if (!hasNextInstallment && !isOpenRecurring) return null;

  return {
    description: payable.description,
    payee: payable.payee,
    amount: payable.amount,
    dueDate: addOneMonth(payable.dueDate),
    status: 'pending',
    isRecurring: payable.isRecurring,
    recurrenceClassification: payable.recurrenceClassification,
    totalInstallments: isOpenRecurring ? 1 : payable.totalInstallments,
    currentInstallment: isOpenRecurring ? 1 : payable.currentInstallment + 1,
    accountId: payable.accountId,
    categoryId: payable.categoryId,
    notes: payable.notes,
  };
}

export function nextReceivablePayload(receivable: AccountReceivable): NewAccountReceivable | null {
  if (!receivable.isRecurring) return null;

  const hasNextInstallment = receivable.currentInstallment < receivable.totalInstallments;
  const isOpenRecurring = receivable.totalInstallments <= 1;
  if (!hasNextInstallment && !isOpenRecurring) return null;

  return {
    description: receivable.description,
    payer: receivable.payer,
    amount: receivable.amount,
    dueDate: addOneMonth(receivable.dueDate),
    status: 'pending',
    isRecurring: receivable.isRecurring,
    recurrenceClassification: receivable.recurrenceClassification,
    totalInstallments: isOpenRecurring ? 1 : receivable.totalInstallments,
    currentInstallment: isOpenRecurring ? 1 : receivable.currentInstallment + 1,
    accountId: receivable.accountId,
    categoryId: receivable.categoryId,
    notes: receivable.notes,
  };
}

export function buildAccountPayablePayload(raw: AccountPayableFormValue): NewAccountPayable {
  const payload: NewAccountPayable = {
    description: raw.description.trim(),
    payee: raw.payee.trim(),
    amount: Number(raw.amount),
    dueDate: raw.dueDate,
    paidAt: raw.paidAt || null,
    status: raw.status,
    isRecurring: raw.isRecurring,
    recurrenceClassification: raw.isRecurring ? raw.recurrenceClassification : null,
    totalInstallments: Math.max(1, Number(raw.totalInstallments) || 1),
    currentInstallment: Math.max(1, Number(raw.currentInstallment) || 1),
    accountId: raw.accountId || null,
    categoryId: raw.categoryId || null,
    notes: raw.notes.trim() || null,
  };

  if (payload.status === 'paid' && !payload.paidAt) {
    payload.paidAt = todayKey();
  }

  return payload;
}

export function buildAccountReceivablePayload(raw: AccountReceivableFormValue): NewAccountReceivable {
  const payload: NewAccountReceivable = {
    description: raw.description.trim(),
    payer: raw.payer.trim(),
    amount: Number(raw.amount),
    dueDate: raw.dueDate,
    receivedAt: raw.receivedAt || null,
    status: raw.status,
    isRecurring: raw.isRecurring,
    recurrenceClassification: raw.isRecurring ? raw.recurrenceClassification : null,
    totalInstallments: Math.max(1, Number(raw.totalInstallments) || 1),
    currentInstallment: Math.max(1, Number(raw.currentInstallment) || 1),
    accountId: raw.accountId || null,
    categoryId: raw.categoryId || null,
    notes: raw.notes.trim() || null,
  };

  if (payload.status === 'received' && !payload.receivedAt) {
    payload.receivedAt = todayKey();
  }

  return payload;
}

export function formatScheduleDate(value: string | null): string {
  if (!value) return '-';

  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function addOneMonth(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day || 1, 12);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
