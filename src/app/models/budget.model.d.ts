/** Resultado de um SELECT na tabela budgets */
export interface Budget {
  id: string;
  categoryId: string;
  amountLimit: number;
  /** Mês de referência (1 a 12) */
  periodMonth: number;
  /** Ano de referência */
  periodYear: number;
}

/** Payload para INSERT na tabela budgets */
export interface NewBudget {
  id?: string;
  categoryId: string;
  amountLimit: number;
  /** Mês de referência (1 a 12) */
  periodMonth: number;
  /** Ano de referência */
  periodYear: number;
}
