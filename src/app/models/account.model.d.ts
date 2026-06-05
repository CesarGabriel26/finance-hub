export type AccountType = 'checking' | 'savings' | 'cash' | 'investment';

/** Resultado de um SELECT na tabela accounts */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankCode: string;
  accountNumber: string;
  color: string | null;
  icon: string | null;
  balance: number | null;
  createdAt: string | null;
}

/** Payload para INSERT na tabela accounts */
export interface NewAccount {
  id?: string;
  name: string;
  type: AccountType;
  bankCode: string;
  accountNumber?: string;
  color?: string | null;
  icon?: string | null;
  balance?: number | null;
  createdAt?: string | null;
}
