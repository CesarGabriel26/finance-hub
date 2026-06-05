import { Injectable } from '@angular/core';
import type { MarketRatesCache } from '../models/market-rate.model';

@Injectable({ providedIn: 'root' })
export class MarketRatesService {
  private get api() {
    return window.MarketRatesApi!;
  }

  getCache(): Promise<MarketRatesCache> {
    return this.api.getCache();
  }

  refresh(): Promise<MarketRatesCache> {
    return this.api.refresh();
  }
}
