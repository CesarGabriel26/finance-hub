export type AssetType = 'fii' | 'stock' | 'cdb' | 'treasury' | 'crypto';

/** Resultado de um SELECT na tabela assets */
export interface Asset {
  id: string;
  /** Código do ativo. Ex: 'HGLG11', 'PETR4', 'CDB_INTER' */
  ticker: string;
  name: string;
  type: AssetType;
  /** Corretora/instituição onde o ativo está custodiado. Ex: 'NuInvest', 'XP', 'Inter' */
  institution: string | null;
}

/** Payload para INSERT na tabela assets */
export interface NewAsset {
  id?: string;
  ticker: string;
  name: string;
  type: AssetType;
  institution?: string | null;
}
