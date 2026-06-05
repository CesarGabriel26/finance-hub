import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/input/input.component';
import { Budget, MonthlyClosing, Transaction } from '../../../models';
import { BudgetsService } from '../../../services/budgets.service';
import { InvestmentPortfoliosService } from '../../../services/investment-portfolios.service';
import { MonthlyClosingsService } from '../../../services/monthly-closings.service';
import { TransactionsService } from '../../../services/transactions.service';

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
    return `${this.form.controls.year.value}-${String(this.form.controls.month.value).padStart(2, '0')}`;
  }

  incomeTotal(): number {
    return this.transactions()
      .filter(transaction => transaction.type === 'credit' && !transaction.ignored)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  expenseTotal(): number {
    return this.transactions()
      .filter(transaction => transaction.type === 'debit' && !transaction.ignored)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  balanceTotal(): number {
    return this.incomeTotal() - this.expenseTotal();
  }

  budgetLimitTotal(): number {
    return this.budgets().reduce((sum, budget) => sum + budget.amountLimit, 0);
  }

  budgetSpentTotal(): number {
    return this.budgets().reduce((sum, budget) => {
      const spent = this.transactions()
        .filter(transaction => transaction.categoryId === budget.categoryId && transaction.type === 'debit')
        .reduce((innerSum, transaction) => innerSum + Math.abs(transaction.amount), 0);

      return sum + spent;
    }, 0);
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
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

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
        this.investedTotal.set(assets.reduce((sum, asset) => {
          const fixedIncome = ['cdb', 'lci_lca', 'treasury'].includes(asset.type);
          const current = fixedIncome
            ? Number(asset.fixedIncomeNetAmount || asset.fixedIncomeGrossAmount || asset.currentPrice)
            : asset.quantity * asset.currentPrice;

          return sum + current;
        }, 0));
      });
  }
}
