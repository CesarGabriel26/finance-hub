export type MonthlyClosingStatus = 'open' | 'closed';

export interface MonthlyClosing {
  id: string;
  period: string;
  incomeTotal: number;
  expenseTotal: number;
  balanceTotal: number;
  investedTotal: number;
  budgetLimitTotal: number;
  budgetSpentTotal: number;
  status: MonthlyClosingStatus;
  notes: string | null;
  closedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NewMonthlyClosing {
  id?: string;
  period: string;
  incomeTotal?: number;
  expenseTotal?: number;
  balanceTotal?: number;
  investedTotal?: number;
  budgetLimitTotal?: number;
  budgetSpentTotal?: number;
  status?: MonthlyClosingStatus;
  notes?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
