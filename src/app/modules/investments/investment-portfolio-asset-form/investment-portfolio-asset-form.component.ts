import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FixedIncomeIndexer,
  FixedIncomeLiquidity,
  FixedIncomeRateType,
  InvestmentPortfolioAsset,
  InvestmentPortfolioAssetType,
} from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent } from '../../../components/select/select.component';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { ModalService } from '../../../services/modal.service';
import { isFixedIncomeType } from '../investment-calculations.util';
import { buildInvestmentAssetPayload } from './investment-portfolio-asset-form.utils';

@Component({
  selector: 'app-investment-portfolio-asset-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './investment-portfolio-asset-form.component.html',
  styleUrl: './investment-portfolio-asset-form.component.css',
})
export class InvestmentPortfolioAssetFormComponent implements OnInit {
  @Input({ required: true }) portfolioId!: string;
  @Input() asset?: InvestmentPortfolioAsset;

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
    const payload = buildInvestmentAssetPayload(this.portfolioId, raw);

    const save = this.asset?.id
      ? this.portfolioService.updateAsset(this.asset.id, payload)
      : this.portfolioService.insertAsset(payload);

    save.then(() => {
      this.portfolioService.updated.emit();
      this.modalService.close();
    });
  }

  isFixedIncome(): boolean {
    return isFixedIncomeType(this.form.controls.type.value);
  }

  private configureValidators(type: InvestmentPortfolioAssetType): void {
    const isFixedIncome = isFixedIncomeType(type);

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
