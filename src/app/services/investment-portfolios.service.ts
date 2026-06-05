import { EventEmitter, Injectable } from '@angular/core';
import type {
  InvestmentPortfolio,
  InvestmentPortfolioAsset,
  NewInvestmentPortfolio,
  NewInvestmentPortfolioAsset,
} from '../models/investment-portfolio.model';

@Injectable({ providedIn: 'root' })
export class InvestmentPortfoliosService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.InvestmentPortfoliosApi!;
  }

  getAll(): Promise<InvestmentPortfolio[]> {
    return this.api.getAll();
  }

  getById(id: string): Promise<InvestmentPortfolio | null> {
    return this.api.getById(id);
  }

  insert(data: NewInvestmentPortfolio): Promise<InvestmentPortfolio> {
    return this.api.insert(data);
  }

  update(id: string, data: Partial<NewInvestmentPortfolio>): Promise<InvestmentPortfolio | null> {
    return this.api.update(id, data);
  }

  delete(id: string): Promise<InvestmentPortfolio | null> {
    return this.api.delete(id);
  }

  getAssets(portfolioId: string): Promise<InvestmentPortfolioAsset[]> {
    return this.api.getAssets(portfolioId);
  }

  insertAsset(data: NewInvestmentPortfolioAsset): Promise<InvestmentPortfolioAsset> {
    return this.api.insertAsset(data);
  }

  updateAsset(
    id: string,
    data: Partial<NewInvestmentPortfolioAsset>,
  ): Promise<InvestmentPortfolioAsset | null> {
    return this.api.updateAsset(id, data);
  }

  deleteAsset(id: string): Promise<InvestmentPortfolioAsset | null> {
    return this.api.deleteAsset(id);
  }
}
