export type SavingGoalStatus = 'active' | 'completed' | 'paused';

/** Resultado de um SELECT na tabela saving_goals */
export interface SavingGoal {
  id: string;
  /** Ex: "Trocar de Carro", "Reserva de Emergência" */
  name: string;
  description: string | null;
  /** Valor total a ser poupado. Ex: 10000.00 */
  targetAmount: number;
  /** Valor já acumulado. Ex: 2500.00 */
  currentAmount: number;
  /** Data limite no formato YYYY-MM-DD (opcional) */
  targetDate: string | null;
  /** Conta/caixinha vinculada à meta (opcional) */
  accountId: string | null;
  status: SavingGoalStatus;
  /** Ícone para renderizar na UI. Ex: 'home', 'flight' */
  icon: string | null;
  /** Cor customizada para a barra de progresso */
  color: string | null;
  createdAt: string | null;
}

/** Payload para INSERT na tabela saving_goals */
export interface NewSavingGoal {
  id?: string;
  name: string;
  description?: string | null;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string | null;
  accountId?: string | null;
  status?: SavingGoalStatus;
  icon?: string | null;
  color?: string | null;
  createdAt?: string | null;
}
