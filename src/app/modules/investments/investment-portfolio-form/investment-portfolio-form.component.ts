import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  InvestmentPortfolio,
  InvestmentPortfolioStrategy,
  InvestmentRiskProfile,
  NewInvestmentPortfolio,
} from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent } from '../../../components/select/select.component';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-investment-portfolio-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './investment-portfolio-form.component.html',
  styleUrl: './investment-portfolio-form.component.css',
})
export class InvestmentPortfolioFormComponent implements OnInit {
  @Input() portfolio?: InvestmentPortfolio;

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    strategy: new FormControl<InvestmentPortfolioStrategy>('balanced', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    riskProfile: new FormControl<InvestmentRiskProfile>('moderate', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    benchmark: new FormControl<string>('CDI', { nonNullable: true }),
    currency: new FormControl<string>('BRL', { nonNullable: true }),
    beginnerMode: new FormControl<boolean>(true, { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private portfolioService: InvestmentPortfoliosService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    if (!this.portfolio) return;

    this.form.patchValue({
      name: this.portfolio.name,
      strategy: this.portfolio.strategy,
      riskProfile: this.portfolio.riskProfile,
      benchmark: this.portfolio.benchmark ?? 'CDI',
      currency: this.portfolio.currency,
      beginnerMode: this.portfolio.beginnerMode,
      notes: this.portfolio.notes ?? '',
    });
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewInvestmentPortfolio = {
      name: raw.name.trim(),
      strategy: raw.strategy,
      riskProfile: raw.riskProfile,
      benchmark: raw.benchmark.trim() || null,
      currency: raw.currency,
      beginnerMode: raw.beginnerMode,
      notes: raw.notes.trim() || null,
    };

    const save = this.portfolio?.id
      ? this.portfolioService.update(this.portfolio.id, payload)
      : this.portfolioService.insert(payload);

    save.then(() => {
      this.portfolioService.updated.emit();
      this.modalService.close();
    });
  }
}
