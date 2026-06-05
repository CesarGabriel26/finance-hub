import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FixedIncomeIndexer,
  FixedIncomeLiquidity,
  FixedIncomeRateType,
  InvestmentPortfolioAsset,
  InvestmentPortfolioAssetType,
  NewInvestmentPortfolioAsset,
} from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent } from '../../../components/select/select.component';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-investment-portfolio-asset-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './investment-portfolio-asset-form.component.html',
  styleUrl: './investment-portfolio-asset-form.component.css',
})
export class InvestmentPortfolioAssetFormComponent implements OnInit {
  @Input({ required: true }) portfolioId!: string;
  @Input() asset?: InvestmentPortfolioAsset;

  private readonly fixedIncomeTypes = new Set<InvestmentPortfolioAssetType>(['cdb', 'lci_lca', 'treasury']);

  form = new FormGroup({
    ticker: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    type: new FormControl<InvestmentPortfolioAssetType>('stock', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    broker: new FormControl<string>('', { nonNullable: true }),
    sector: new FormControl<string>('', { nonNullable: true }),
    currency: new FormControl<string>('BRL', { nonNullable: true }),
    quantity: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.000001)],
    }),
    averagePrice: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    currentPrice: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    purchaseDate: new FormControl<string>('', { nonNullable: true }),
    targetAllocation: new FormControl<number>(0, { nonNullable: true }),
    dividendYield: new FormControl<number>(0, { nonNullable: true }),
    annualIncome: new FormControl<number>(0, { nonNullable: true }),
    fixedIncomeIndexer: new FormControl<FixedIncomeIndexer>('cdi', { nonNullable: true }),
    fixedIncomeRateType: new FormControl<FixedIncomeRateType>('percent_indexer', { nonNullable: true }),
    fixedIncomeRate: new FormControl<number>(100, { nonNullable: true }),
    fixedIncomeMaturityDate: new FormControl<string>('', { nonNullable: true }),
    fixedIncomeLiquidity: new FormControl<FixedIncomeLiquidity>('daily', { nonNullable: true }),
    fixedIncomeInvestedAmount: new FormControl<number>(0, { nonNullable: true }),
    fixedIncomeGrossAmount: new FormControl<number>(0, { nonNullable: true }),
    fixedIncomeNetAmount: new FormControl<number>(0, { nonNullable: true }),
    fixedIncomeTaxExempt: new FormControl<boolean>(false, { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private portfolioService: InvestmentPortfoliosService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.form.controls.type.valueChanges.subscribe(type => this.configureValidators(type));

    if (this.asset) {
      this.form.patchValue({
        ticker: this.asset.ticker,
        name: this.asset.name,
        type: this.asset.type,
        broker: this.asset.broker ?? '',
        sector: this.asset.sector ?? '',
        currency: this.asset.currency,
        quantity: this.asset.quantity,
        averagePrice: this.asset.averagePrice,
        currentPrice: this.asset.currentPrice,
        purchaseDate: this.asset.purchaseDate ?? '',
        targetAllocation: this.asset.targetAllocation,
        dividendYield: this.asset.dividendYield,
        annualIncome: this.asset.annualIncome,
        fixedIncomeIndexer: this.asset.fixedIncomeIndexer ?? 'cdi',
        fixedIncomeRateType: this.asset.fixedIncomeRateType ?? 'percent_indexer',
        fixedIncomeRate: this.asset.fixedIncomeRate ?? 100,
        fixedIncomeMaturityDate: this.asset.fixedIncomeMaturityDate ?? '',
        fixedIncomeLiquidity: this.asset.fixedIncomeLiquidity ?? 'daily',
        fixedIncomeInvestedAmount: this.asset.fixedIncomeInvestedAmount ?? this.asset.averagePrice,
        fixedIncomeGrossAmount: this.asset.fixedIncomeGrossAmount ?? this.asset.currentPrice,
        fixedIncomeNetAmount: this.asset.fixedIncomeNetAmount ?? 0,
        fixedIncomeTaxExempt: Boolean(this.asset.fixedIncomeTaxExempt),
        notes: this.asset.notes ?? '',
      });
    }

    this.configureValidators(this.form.controls.type.value);
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const isFixedIncome = this.isFixedIncomeType(raw.type);
    const fixedIncomeInvestedAmount = Number(raw.fixedIncomeInvestedAmount) || 0;
    const fixedIncomeGrossAmount = Number(raw.fixedIncomeGrossAmount) || 0;
    const informedFixedIncomeNetAmount = Number(raw.fixedIncomeNetAmount) || 0;
    const fixedIncomeGrossCurrentAmount = fixedIncomeGrossAmount || informedFixedIncomeNetAmount || fixedIncomeInvestedAmount;
    const estimatedFixedIncomeNetAmount = this.estimateFixedIncomeNetAmount({
      investedAmount: fixedIncomeInvestedAmount,
      grossAmount: fixedIncomeGrossCurrentAmount,
      purchaseDate: raw.purchaseDate,
      taxExempt: raw.fixedIncomeTaxExempt,
    });
    const fixedIncomeNetCurrentAmount = informedFixedIncomeNetAmount || estimatedFixedIncomeNetAmount;
    const investedAmount = isFixedIncome ? fixedIncomeInvestedAmount : Number(raw.quantity) * Number(raw.averagePrice);
    const currentAmount = isFixedIncome ? fixedIncomeNetCurrentAmount : Number(raw.quantity) * Number(raw.currentPrice);
    const grossResultAmount = isFixedIncome
      ? fixedIncomeGrossCurrentAmount - investedAmount
      : currentAmount - investedAmount;

    const payload: NewInvestmentPortfolioAsset = {
      portfolioId: this.portfolioId,
      ticker: raw.ticker.trim().toUpperCase(),
      name: raw.name.trim(),
      type: raw.type,
      broker: raw.broker.trim() || null,
      sector: raw.sector.trim() || null,
      currency: raw.currency,
      quantity: isFixedIncome ? 1 : Number(raw.quantity),
      averagePrice: isFixedIncome ? fixedIncomeInvestedAmount : Number(raw.averagePrice),
      currentPrice: isFixedIncome ? fixedIncomeNetCurrentAmount : Number(raw.currentPrice),
      purchaseDate: raw.purchaseDate || null,
      targetAllocation: Number(raw.targetAllocation) || 0,
      dividendYield: Number(raw.dividendYield) || 0,
      annualIncome: isFixedIncome ? Math.max(0, grossResultAmount) : Number(raw.annualIncome) || 0,
      fixedIncomeIndexer: isFixedIncome ? raw.fixedIncomeIndexer : null,
      fixedIncomeRateType: isFixedIncome ? raw.fixedIncomeRateType : null,
      fixedIncomeRate: isFixedIncome ? Number(raw.fixedIncomeRate) || 0 : null,
      fixedIncomeMaturityDate: isFixedIncome ? raw.fixedIncomeMaturityDate || null : null,
      fixedIncomeLiquidity: isFixedIncome ? raw.fixedIncomeLiquidity : null,
      fixedIncomeInvestedAmount: isFixedIncome ? fixedIncomeInvestedAmount : null,
      fixedIncomeGrossAmount: isFixedIncome ? fixedIncomeGrossCurrentAmount : null,
      fixedIncomeNetAmount: isFixedIncome ? fixedIncomeNetCurrentAmount || null : null,
      fixedIncomeTaxExempt: isFixedIncome ? raw.fixedIncomeTaxExempt : null,
      notes: raw.notes.trim() || null,
    };

    const save = this.asset?.id
      ? this.portfolioService.updateAsset(this.asset.id, payload)
      : this.portfolioService.insertAsset(payload);

    save.then(() => {
      this.portfolioService.updated.emit();
      this.modalService.close();
    });
  }

  isFixedIncome(): boolean {
    return this.isFixedIncomeType(this.form.controls.type.value);
  }

  private isFixedIncomeType(type: InvestmentPortfolioAssetType): boolean {
    return this.fixedIncomeTypes.has(type);
  }

  private estimateFixedIncomeNetAmount(options: {
    investedAmount: number;
    grossAmount: number;
    purchaseDate: string;
    taxExempt: boolean;
  }): number {
    const profit = Math.max(0, options.grossAmount - options.investedAmount);
    if (profit <= 0 || options.taxExempt) return options.grossAmount;

    const days = this.holdingDays(options.purchaseDate);
    const iof = profit * this.iofRate(days);
    const taxableProfit = Math.max(0, profit - iof);
    const ir = taxableProfit * this.incomeTaxRate(days);

    return options.grossAmount - iof - ir;
  }

  private holdingDays(purchaseDate: string): number {
    if (!purchaseDate) return 721;

    const start = new Date(`${purchaseDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return 721;

    const today = new Date();
    const diff = today.getTime() - start.getTime();

    return Math.max(0, Math.floor(diff / 86400000));
  }

  private incomeTaxRate(days: number): number {
    if (days <= 180) return 0.225;
    if (days <= 360) return 0.2;
    if (days <= 720) return 0.175;
    return 0.15;
  }

  private iofRate(days: number): number {
    const rates = [
      0, 0.96, 0.93, 0.9, 0.86, 0.83, 0.8, 0.76, 0.73, 0.7,
      0.66, 0.63, 0.6, 0.56, 0.53, 0.5, 0.46, 0.43, 0.4, 0.36,
      0.33, 0.3, 0.26, 0.23, 0.2, 0.16, 0.13, 0.1, 0.06, 0.03, 0,
    ];

    return days >= 30 ? 0 : rates[Math.max(0, days)] ?? 0;
  }

  private configureValidators(type: InvestmentPortfolioAssetType): void {
    const isFixedIncome = this.isFixedIncomeType(type);

    if (isFixedIncome) {
      this.form.controls.quantity.clearValidators();
      this.form.controls.averagePrice.clearValidators();
      this.form.controls.currentPrice.clearValidators();
      this.form.controls.fixedIncomeInvestedAmount.setValidators([Validators.required, Validators.min(0.01)]);
      this.form.controls.fixedIncomeGrossAmount.setValidators([Validators.min(0)]);

      if (this.form.controls.quantity.value <= 0) this.form.controls.quantity.setValue(1, { emitEvent: false });
      if (this.form.controls.averagePrice.value <= 0) {
        this.form.controls.averagePrice.setValue(this.form.controls.fixedIncomeInvestedAmount.value || 0.01, { emitEvent: false });
      }
      if (this.form.controls.currentPrice.value <= 0) {
        this.form.controls.currentPrice.setValue(this.form.controls.fixedIncomeGrossAmount.value || 0.01, { emitEvent: false });
      }
    } else {
      this.form.controls.quantity.setValidators([Validators.required, Validators.min(0.000001)]);
      this.form.controls.averagePrice.setValidators([Validators.required, Validators.min(0.01)]);
      this.form.controls.currentPrice.setValidators([Validators.required, Validators.min(0.01)]);
      this.form.controls.fixedIncomeInvestedAmount.clearValidators();
      this.form.controls.fixedIncomeGrossAmount.clearValidators();
    }

    [
      this.form.controls.quantity,
      this.form.controls.averagePrice,
      this.form.controls.currentPrice,
      this.form.controls.fixedIncomeInvestedAmount,
      this.form.controls.fixedIncomeGrossAmount,
    ].forEach(control => control.updateValueAndValidity({ emitEvent: false }));
  }
}
