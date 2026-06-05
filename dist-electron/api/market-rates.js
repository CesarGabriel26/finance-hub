"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketRatesCache = getMarketRatesCache;
exports.loadMarketRatesCache = loadMarketRatesCache;
exports.registerMarketRatesHandlers = registerMarketRatesHandlers;
const electron_1 = require("electron");
const MARKET_RATES_URL = 'https://brasilapi.com.br/api/taxas/v1';
let cache = {
    rates: [],
    fetchedAt: null,
    status: 'idle',
    error: null,
};
let inFlightRequest = null;
function normalizeMarketRates(payload) {
    if (!Array.isArray(payload))
        return [];
    return payload
        .map(item => {
        if (!item || typeof item !== 'object')
            return null;
        const rate = item;
        const value = Number(rate.valor);
        if (typeof rate.nome !== 'string' || !Number.isFinite(value))
            return null;
        return {
            nome: rate.nome,
            valor: value,
        };
    })
        .filter((item) => item !== null);
}
function getMarketRatesCache() {
    return cache;
}
async function loadMarketRatesCache() {
    if (inFlightRequest)
        return inFlightRequest;
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
        }
        catch (error) {
            cache = {
                ...cache,
                status: 'error',
                error: error instanceof Error ? error.message : 'Nao foi possivel carregar as taxas',
            };
        }
        finally {
            inFlightRequest = null;
        }
        return cache;
    })();
    return inFlightRequest;
}
function registerMarketRatesHandlers() {
    electron_1.ipcMain.handle('market-rates:get-cache', () => getMarketRatesCache());
    electron_1.ipcMain.handle('market-rates:refresh', () => loadMarketRatesCache());
}
