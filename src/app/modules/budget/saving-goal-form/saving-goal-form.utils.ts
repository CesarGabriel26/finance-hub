import type { NewSavingGoal, SavingGoalStatus } from '../../../models';

export interface SavingGoalFormValue {
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  accountId: string;
  status: SavingGoalStatus;
  color: string;
  icon: string;
}

export function buildSavingGoalPayload(raw: SavingGoalFormValue): NewSavingGoal {
  return {
    name: raw.name.trim(),
    description: raw.description.trim() || null,
    targetAmount: Number(raw.targetAmount),
    currentAmount: Number(raw.currentAmount) || 0,
    targetDate: raw.targetDate || null,
    accountId: raw.accountId || null,
    status: raw.status,
    color: raw.color,
    icon: raw.icon,
  };
}
