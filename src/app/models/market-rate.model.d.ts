export interface MarketRate {
  nome: string;
  valor: number;
}

export interface MarketRatesCache {
  rates: MarketRate[];
  fetchedAt: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}
