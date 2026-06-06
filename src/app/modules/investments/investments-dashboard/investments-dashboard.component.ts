import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import {
  InvestmentAssetSnapshot,
  InvestmentPortfolio,
  InvestmentPortfolioAsset,
  MarketRate,
  MarketRatesCache,
} from '../../../models';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { MarketRatesService } from '../../../services/market-rates.service';
import { ModalService } from '../../../services/modal.service';
import {
  AllocationBucket,
  AllocationProfile,
  InvestmentSnapshotEvolutionPoint,
  allocation,
  allocationBuckets,
  allocationGap,
  allocationProfileMessage,
  allocationProfileScore,
  annualIncomeValue,
  currentValue,
  fixedIncomeLiquidityLabel,
  fixedIncomeRateLabel,
  fixedIncomeSummary,
  formatShortDate,
  grossCurrentValue,
  incomeValue,
  investedValue,
  isFixedIncomeAsset,
  lastSnapshotDateLabel,
  netResultValue,
  portfolioYield,
  recommendedAllocationProfile,
  resultPercent,
  resultValue,
  targetGap,
  taxWithheldValue,
  totalCurrentValue,
  totalInvestedValue,
  totalNetResultValue,
  totalResultPercent,
  totalResultValue,
  totalTaxWithheldValue,
  typeLabel,
  snapshotEvolution,
  RISK_PROFILES_LABELS,
  STRATEGIES_LABELS,
} from '../investment-calculations.util';
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
  assetSnapshots = signal<InvestmentAssetSnapshot[]>([]);
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

  RISK_PROFILES_LABELS = RISK_PROFILES_LABELS;
  STRATEGIES_LABELS = STRATEGIES_LABELS;

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
    return investedValue(asset);
  }

  currentValue(asset: InvestmentPortfolioAsset): number {
    return currentValue(asset);
  }

  grossCurrentValue(asset: InvestmentPortfolioAsset): number {
    return grossCurrentValue(asset);
  }

  resultValue(asset: InvestmentPortfolioAsset): number {
    return resultValue(asset);
  }

  netResultValue(asset: InvestmentPortfolioAsset): number {
    return netResultValue(asset);
  }

  taxWithheldValue(asset: InvestmentPortfolioAsset): number {
    return taxWithheldValue(asset);
  }

  resultPercent(asset: InvestmentPortfolioAsset): number {
    return resultPercent(asset);
  }

  totalInvested(): number {
    return totalInvestedValue(this.assets());
  }

  totalCurrent(): number {
    return totalCurrentValue(this.assets());
  }

  totalResult(): number {
    return totalResultValue(this.assets());
  }

  totalNetResult(): number {
    return totalNetResultValue(this.assets());
  }

  totalTaxWithheld(): number {
    return totalTaxWithheldValue(this.assets());
  }

  totalResultPercent(): number {
    return totalResultPercent(this.assets());
  }

  annualIncome(): number {
    return annualIncomeValue(this.assets());
  }

  portfolioYield(): number {
    return portfolioYield(this.assets());
  }

  recommendedAllocationProfile(): AllocationProfile {
    return recommendedAllocationProfile(this.selectedPortfolio());
  }

  allocationBuckets(): AllocationBucket[] {
    return allocationBuckets(this.assets(), this.recommendedAllocationProfile());
  }

  allocationProfileScore(): number {
    return allocationProfileScore(this.allocationBuckets());
  }

  allocationProfileMessage(): string {
    return allocationProfileMessage(this.assets().length, this.allocationProfileScore());
  }

  allocationGap(bucket: AllocationBucket): number {
    return allocationGap(bucket);
  }

  allocation(asset: InvestmentPortfolioAsset): number {
    return allocation(asset, this.totalCurrent());
  }

  targetGap(asset: InvestmentPortfolioAsset): number {
    return targetGap(asset, this.totalCurrent());
  }

  snapshotEvolution(): InvestmentSnapshotEvolutionPoint[] {
    return snapshotEvolution(this.assetSnapshots());
  }

  lastSnapshotDate(): string {
    return lastSnapshotDateLabel(this.assetSnapshots());
  }

  incomeValue(asset: InvestmentPortfolioAsset): number {
    return incomeValue(asset);
  }

  typeLabel(asset: InvestmentPortfolioAsset): string {
    return typeLabel(asset);
  }

  isFixedIncomeAsset(asset: InvestmentPortfolioAsset): boolean {
    return isFixedIncomeAsset(asset);
  }

  fixedIncomeSummary(asset: InvestmentPortfolioAsset): string {
    return fixedIncomeSummary(asset);
  }

  fixedIncomeRateLabel(asset: InvestmentPortfolioAsset): string {
    return fixedIncomeRateLabel(asset);
  }

  fixedIncomeLiquidityLabel(asset: InvestmentPortfolioAsset): string {
    return fixedIncomeLiquidityLabel(asset);
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
    return formatShortDate(value);
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
      this.assetSnapshots.set([]);
      return;
    }

    Promise.all([
      this.portfolioService.getAssets(portfolioId),
      this.portfolioService.getAssetSnapshots(portfolioId),
    ]).then(([assets, snapshots]) => {
      this.assets.set(assets);
      this.assetSnapshots.set(snapshots);
    });
  }
}
