import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { InvestmentPortfolio, InvestmentPortfolioAsset, MarketRate, MarketRatesCache } from '../../../models';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { MarketRatesService } from '../../../services/market-rates.service';
import { ModalService } from '../../../services/modal.service';
import { InvestmentPortfolioAssetFormComponent } from '../investment-portfolio-asset-form/investment-portfolio-asset-form.component';
import { InvestmentPortfolioFormComponent } from '../investment-portfolio-form/investment-portfolio-form.component';

@Component({
  selector: 'app-investments-dashboard',
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    DataTableComponent,
    SelectComponent,
  ],
  templateUrl: './investments-dashboard.component.html',
  styleUrl: './investments-dashboard.component.css',
})
export class InvestmentsDashboardComponent implements OnInit {
  portfolios = signal<InvestmentPortfolio[]>([]);
  assets = signal<InvestmentPortfolioAsset[]>([]);
  portfolioOptions = signal<SelectOption[]>([]);
  marketRates = signal<MarketRatesCache>({
    rates: [],
    fetchedAt: null,
    status: 'idle',
    error: null,
  });
  selectedPortfolioId = new FormControl<string>('', { nonNullable: true });

  readonly assetColumns: DataTableColumn<InvestmentPortfolioAsset>[] = [
    { key: 'ticker', label: 'Ativo' },
    { key: 'quantity', label: 'Qtd' },
    { key: 'averagePrice', label: 'PM' },
    { key: 'currentPrice', label: 'Atual' },
  ];

  readonly assetMenuItems: ContextMenuItem<InvestmentPortfolioAsset>[] = [
    {
      label: 'Editar ativo',
      icon: 'edit',
      onClick: asset => this.openAssetModal(asset),
    },
    {
      label: 'Excluir ativo',
      icon: 'delete',
      onClick: asset => this.deleteAsset(asset),
    },
  ];

  readonly portfolioMenuItems: ContextMenuItem<InvestmentPortfolio>[] = [
    {
      label: 'Editar carteira',
      icon: 'edit',
      onClick: portfolio => this.openPortfolioModal(portfolio),
    },
    {
      label: 'Excluir carteira',
      icon: 'delete',
      onClick: portfolio => this.deletePortfolio(portfolio),
    },
  ];

  constructor(
    private portfolioService: InvestmentPortfoliosService,
    private marketRatesService: MarketRatesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadMarketRates();
    this.loadPortfolios();
    this.portfolioService.updated.subscribe(() => this.loadPortfolios());
    this.selectedPortfolioId.valueChanges.subscribe(id => this.loadAssets(id));
  }

  selectedPortfolio(): InvestmentPortfolio | undefined {
    return this.portfolios().find(portfolio => portfolio.id === this.selectedPortfolioId.value);
  }

  isBeginnerMode(): boolean {
    return this.selectedPortfolio()?.beginnerMode ?? false;
  }

  openPortfolioModal(portfolio?: InvestmentPortfolio): void {
    this.modalService.open(InvestmentPortfolioFormComponent, { portfolio });
  }

  openAssetModal(asset?: InvestmentPortfolioAsset): void {
    const portfolioId = this.selectedPortfolioId.value;
    if (!portfolioId) return;

    this.modalService.open(InvestmentPortfolioAssetFormComponent, { portfolioId, asset });
  }

  toggleBeginnerMode(): void {
    const portfolio = this.selectedPortfolio();
    if (!portfolio) return;

    this.portfolioService
      .update(portfolio.id, { beginnerMode: !portfolio.beginnerMode })
      .then(() => this.portfolioService.updated.emit());
  }

  deletePortfolio(portfolio: InvestmentPortfolio): void {
    this.portfolioService.delete(portfolio.id).then(() => {
      this.portfolioService.updated.emit();
    });
  }

  deleteAsset(asset: InvestmentPortfolioAsset): void {
    this.portfolioService.deleteAsset(asset.id).then(() => {
      this.portfolioService.updated.emit();
    });
  }

  identifyAsset(asset: InvestmentPortfolioAsset): string {
    return asset.id;
  }

  investedValue(asset: InvestmentPortfolioAsset): number {
    return asset.quantity * asset.averagePrice;
  }

  currentValue(asset: InvestmentPortfolioAsset): number {
    return asset.quantity * asset.currentPrice;
  }

  resultValue(asset: InvestmentPortfolioAsset): number {
    return this.currentValue(asset) - this.investedValue(asset);
  }

  resultPercent(asset: InvestmentPortfolioAsset): number {
    const invested = this.investedValue(asset);
    return invested > 0 ? (this.resultValue(asset) / invested) * 100 : 0;
  }

  totalInvested(): number {
    return this.assets().reduce((sum, asset) => sum + this.investedValue(asset), 0);
  }

  totalCurrent(): number {
    return this.assets().reduce((sum, asset) => sum + this.currentValue(asset), 0);
  }

  totalResult(): number {
    return this.totalCurrent() - this.totalInvested();
  }

  totalResultPercent(): number {
    const invested = this.totalInvested();
    return invested > 0 ? (this.totalResult() / invested) * 100 : 0;
  }

  annualIncome(): number {
    return this.assets().reduce((sum, asset) => sum + asset.annualIncome, 0);
  }

  portfolioYield(): number {
    const total = this.totalCurrent();
    return total > 0 ? (this.annualIncome() / total) * 100 : 0;
  }

  allocation(asset: InvestmentPortfolioAsset): number {
    const total = this.totalCurrent();
    return total > 0 ? (this.currentValue(asset) / total) * 100 : 0;
  }

  targetGap(asset: InvestmentPortfolioAsset): number {
    return this.allocation(asset) - asset.targetAllocation;
  }

  typeLabel(asset: InvestmentPortfolioAsset): string {
    const labels: Record<InvestmentPortfolioAsset['type'], string> = {
      stock: 'Acao',
      fii: 'FII',
      etf: 'ETF',
      bdr: 'BDR',
      reit: 'REIT',
      international_stock: 'Acao Intl.',
      cdb: 'CDB',
      lci_lca: 'LCI/LCA',
      treasury: 'Tesouro',
      crypto: 'Cripto',
      fund: 'Fundo',
      other: 'Outro',
    };

    return labels[asset.type];
  }

  isFixedIncomeAsset(asset: InvestmentPortfolioAsset): boolean {
    return ['cdb', 'lci_lca', 'treasury'].includes(asset.type);
  }

  fixedIncomeSummary(asset: InvestmentPortfolioAsset): string {
    if (!this.isFixedIncomeAsset(asset)) {
      return asset.sector || 'Sem setor';
    }

    const parts = [
      this.fixedIncomeRateLabel(asset),
      this.fixedIncomeLiquidityLabel(asset),
      asset.fixedIncomeMaturityDate ? `vence em ${this.formatShortDate(asset.fixedIncomeMaturityDate)}` : '',
      asset.fixedIncomeTaxExempt ? 'isento de IR' : '',
    ].filter(Boolean);

    return parts.join(' - ') || 'Renda fixa';
  }

  fixedIncomeRateLabel(asset: InvestmentPortfolioAsset): string {
    if (!asset.fixedIncomeIndexer || asset.fixedIncomeRate === null || asset.fixedIncomeRate === undefined) {
      return this.typeLabel(asset);
    }

    const indexer = {
      cdi: 'CDI',
      selic: 'Selic',
      ipca: 'IPCA',
      prefixed: 'Prefixado',
      igpm: 'IGP-M',
      other: 'Outro',
    }[asset.fixedIncomeIndexer];
    const rate = asset.fixedIncomeRate.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (asset.fixedIncomeRateType === 'percent_indexer') return `${rate}% do ${indexer}`;
    if (asset.fixedIncomeRateType === 'indexer_plus') return `${indexer} + ${rate}%`;

    return `${rate}% a.a.`;
  }

  fixedIncomeLiquidityLabel(asset: InvestmentPortfolioAsset): string {
    const labels: Record<NonNullable<InvestmentPortfolioAsset['fixedIncomeLiquidity']>, string> = {
      daily: 'liquidez diaria',
      maturity: 'liquidez no vencimento',
      custom: 'liquidez personalizada',
    };

    return asset.fixedIncomeLiquidity ? labels[asset.fixedIncomeLiquidity] : '';
  }

  formatPercent(value: number): string {
    return `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  formatRate(rate: MarketRate): string {
    return `${rate.valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  marketRatesUpdatedAt(): string {
    const fetchedAt = this.marketRates().fetchedAt;
    if (!fetchedAt) return 'Aguardando BrasilAPI';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fetchedAt));
  }

  resultClass(value: number): string {
    if (value > 0) return 'text-emerald-700';
    if (value < 0) return 'text-red-700';
    return 'text-muted-foreground';
  }

  private formatShortDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  private loadPortfolios(): void {
    const previousId = this.selectedPortfolioId.value;

    this.portfolioService.getAll().then(portfolios => {
      this.portfolios.set(portfolios);
      this.portfolioOptions.set(portfolios.map(portfolio => ({
        value: portfolio.id,
        label: portfolio.name,
        icon: 'workspaces',
      })));

      const selected = portfolios.find(portfolio => portfolio.id === previousId) ?? portfolios[0];
      this.selectedPortfolioId.setValue(selected?.id ?? '', { emitEvent: true });

      if (!selected) {
        this.assets.set([]);
      }
    });
  }

  private loadMarketRates(): void {
    this.marketRatesService
      .getCache()
      .then(cache => {
        if (
          cache.status === 'idle' ||
          cache.status === 'loading' ||
          (cache.status === 'error' && cache.rates.length === 0)
        ) {
          return this.marketRatesService.refresh();
        }

        return cache;
      })
      .then(cache => this.marketRates.set(cache));
  }

  private loadAssets(portfolioId: string): void {
    if (!portfolioId) {
      this.assets.set([]);
      return;
    }

    this.portfolioService.getAssets(portfolioId).then(assets => {
      this.assets.set(assets);
    });
  }
}
