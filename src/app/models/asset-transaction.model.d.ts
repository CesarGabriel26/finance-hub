export type AssetTransactionType = 'buy' | 'sell' | 'dividend' | 'interest';

/** Resultado de um SELECT na tabela asset_transactions */
export interface AssetTransaction {
  id: string;
  assetId: string;
  accountId: string;
  type: AssetTransactionType;
  /** Suporta frações (ex: 0.0025 BTC) */
  quantity: number;
  pricePerUnit: number;
  /** Taxas B3, corretagem */
  costs: number | null;
  /** Data da transação no formato ISO ou YYYY-MM-DD */
  date: string;
  createdAt: string | null;
}

/** Payload para INSERT na tabela asset_transactions */
export interface NewAssetTransaction {
  id?: string;
  assetId: string;
  accountId: string;
  type: AssetTransactionType;
  quantity: number;
  pricePerUnit: number;
  costs?: number | null;
  date: string;
  createdAt?: string | null;
}
