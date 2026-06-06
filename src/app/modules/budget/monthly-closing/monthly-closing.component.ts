import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/input/input.component';
import { Budget, MonthlyClosing, Transaction } from '../../../models';
import { BudgetsService } from '../../../services/budgets.service';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { MonthlyClosingsService } from '../../../services/monthly-closings.service';
import { TransactionsService } from '../../../services/transactions.service';
import {
  budgetLimitTotal,
  budgetSpentTotal,
  closingPeriod,
  closingPeriodRange,
  expenseTotal,
  incomeTotal,
  investedTotal,
} from './monthly-closing.utils';

@Component({
  selector: 'app-monthly-closing',
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, InputComponent],
  templateUrl: './monthly-closing.component.html',
  styleUrl: './monthly-closing.component.css',
})
export class MonthlyClosingComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  budgets = signal<Budget[]>([]);
  closings = signal<MonthlyClosing[]>([]);
  investedTotal = signal(0);
  message = signal('');

  form = new FormGroup({
    month: new FormControl<number>(new Date().getMonth() + 1, { nonNullable: true }),
    year: new FormControl<number>(new Date().getFullYear(), { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private transactionsService: TransactionsService,
    private budgetsService: BudgetsService,
    private portfolioService: InvestmentPortfoliosService,
    private monthlyClosingsService: MonthlyClosingsService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.form.valueChanges.subscribe(() => this.loadMonthData());
    this.monthlyClosingsService.updated.subscribe(() => this.loadClosings());
  }

  period(): string {
    return closingPeriod(this.form.controls.month.value, this.form.controls.year.value);
  }

  incomeTotal(): number {
    return incomeTotal(this.transactions());
  }

  expenseTotal(): number {
    return expenseTotal(this.transactions());
  }

  balanceTotal(): number {
    return this.incomeTotal() - this.expenseTotal();
  }

  budgetLimitTotal(): number {
    return budgetLimitTotal(this.budgets());
  }

  budgetSpentTotal(): number {
    return budgetSpentTotal(this.budgets(), this.transactions());
  }

  closeMonth(): void {
    this.monthlyClosingsService.upsert({
      period: this.period(),
      incomeTotal: this.incomeTotal(),
      expenseTotal: this.expenseTotal(),
      balanceTotal: this.balanceTotal(),
      investedTotal: this.investedTotal(),
      budgetLimitTotal: this.budgetLimitTotal(),
      budgetSpentTotal: this.budgetSpentTotal(),
      status: 'closed',
      notes: this.form.controls.notes.value.trim() || null,
      closedAt: new Date().toISOString(),
    }).then(() => {
      this.message.set('Mes fechado com sucesso.');
      this.monthlyClosingsService.updated.emit();
    });
  }

  private load(): void {
    this.loadMonthData();
    this.loadClosings();
    this.loadInvestedTotal();
  }

  private loadMonthData(): void {
    const month = Number(this.form.controls.month.value);
    const year = Number(this.form.controls.year.value);
    const { start, end } = closingPeriodRange(month, year);

    Promise.all([
      this.transactionsService.getAll({ date: { between: [start, end] } }),
      this.budgetsService.getAll(month, year),
    ]).then(([transactions, budgets]) => {
      this.transactions.set(transactions);
      this.budgets.set(budgets);
    });
  }

  private loadClosings(): void {
    this.monthlyClosingsService.getAll().then(closings => this.closings.set(closings));
  }

  private loadInvestedTotal(): void {
    this.portfolioService.getAll()
      .then(portfolios => Promise.all(portfolios.map(portfolio => this.portfolioService.getAssets(portfolio.id))))
      .then(groups => groups.flat())
      .then(assets => {
        this.investedTotal.set(investedTotal(assets));
      });
  }
}
