import { ipcMain } from 'electron';

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

const MARKET_RATES_URL = 'https://brasilapi.com.br/api/taxas/v1';

let cache: MarketRatesCache = {
  rates: [],
  fetchedAt: null,
  status: 'idle',
  error: null,
};
let inFlightRequest: Promise<MarketRatesCache> | null = null;

function normalizeMarketRates(payload: unknown): MarketRate[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map(item => {
      if (!item || typeof item !== 'object') return null;

      const rate = item as Partial<MarketRate>;
      const value = Number(rate.valor);

      if (typeof rate.nome !== 'string' || !Number.isFinite(value)) return null;

      return {
        nome: rate.nome,
        valor: value,
      };
    })
    .filter((item): item is MarketRate => item !== null);
}

export function getMarketRatesCache(): MarketRatesCache {
  return cache;
}

export async function loadMarketRatesCache(): Promise<MarketRatesCache> {
  if (inFlightRequest) return inFlightRequest;

  cache = {
    ...cache,
    status: 'loading',
    error: null,
  };

  inFlightRequest = (async () => {
    try {
      const response = await fetch(MARKET_RATES_URL, {
        headers: {
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`BrasilAPI respondeu com status ${response.status}`);
      }

      const payload = await response.json();
      const rates = normalizeMarketRates(payload);

      cache = {
        rates,
        fetchedAt: new Date().toISOString(),
        status: 'ready',
        error: null,
      };
    } catch (error) {
      cache = {
        ...cache,
        status: 'error',
        error: error instanceof Error ? error.message : 'Nao foi possivel carregar as taxas',
      };
    } finally {
      inFlightRequest = null;
    }

    return cache;
  })();

  return inFlightRequest;
}

export function registerMarketRatesHandlers(): void {
  ipcMain.handle('market-rates:get-cache', () => getMarketRatesCache());
  ipcMain.handle('market-rates:refresh', () => loadMarketRatesCache());
}
