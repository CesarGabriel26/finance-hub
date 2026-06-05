import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ContextMenuComponent, ContextMenuItem, ContextMenuTriggerDirective } from '../../../components/context-menu/context-menu.component';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { InputComponent } from '../../../components/input/input.component';
import { Budget, Category, Transaction } from '../../../models';
import { BudgetsService } from '../../../services/budgets.service';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { TransactionsService } from '../../../services/transactions.service';
import { ExpenseBudgetFormComponent } from '../expense-budget-form/expense-budget-form.component';

@Component({
  selector: 'app-expense-budgets.component',
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    ContextMenuComponent,
    ContextMenuTriggerDirective,
    DataTableComponent,
    InputComponent,
  ],
  templateUrl: './expense-budgets.component.html',
  styleUrl: './expense-budgets.component.css',
})
export class ExpenseBudgetsComponent implements OnInit {
  budgets = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  transactions = signal<Transaction[]>([]);

  filters = new FormGroup({
    month: new FormControl<number>(new Date().getMonth() + 1, { nonNullable: true }),
    year: new FormControl<number>(new Date().getFullYear(), { nonNullable: true }),
  });

  readonly columns: DataTableColumn<Budget>[] = [
    { key: 'categoryId', label: 'Categoria' },
    { key: 'amountLimit', label: 'Limite' },
  ];

  readonly menuItems: ContextMenuItem<Budget>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: budget => this.openModal(budget),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      onClick: budget => this.delete(budget),
    },
  ];

  constructor(
    private budgetsService: BudgetsService,
    private categoriesService: CategoriesService,
    private transactionsService: TransactionsService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadReferences();
    this.search();

    this.budgetsService.updated.subscribe(() => this.search());
    this.transactionsService.updated.subscribe(() => this.searchTransactions());

    this.filters.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe(() => this.search());
  }

  identifyBudget(row: Budget): string {
    return row.id;
  }

  openModal(budget?: Budget): void {
    this.modalService.open(ExpenseBudgetFormComponent, {
      budget,
      month: Number(this.filters.value.month),
      year: Number(this.filters.value.year),
    });
  }

  search(): void {
    const month = Number(this.filters.value.month);
    const year = Number(this.filters.value.year);

    this.budgetsService.getAll(month, year).then(budgets => {
      this.budgets.set(budgets);
    });

    this.searchTransactions();
  }

  searchTransactions(): void {
    const month = Number(this.filters.value.month);
    const year = Number(this.filters.value.year);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    this.transactionsService
      .getAll({
        type: { eq: 'debit' },
        ignored: { eq: false },
        date: { between: [start, end] },
      })
      .then(transactions => this.transactions.set(transactions));
  }

  delete(budget: Budget): void {
    this.budgetsService.delete(budget.id).then(() => {
      this.budgetsService.updated.emit();
    });
  }

  getCategory(budget: Budget): Category | undefined {
    return this.categories().find(category => category.id === budget.categoryId);
  }

  spent(budget: Budget): number {
    return this.transactions()
      .filter(transaction => transaction.categoryId === budget.categoryId)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  remaining(budget: Budget): number {
    return budget.amountLimit - this.spent(budget);
  }

  progress(budget: Budget): number {
    if (budget.amountLimit <= 0) return 0;
    return Math.min(100, (this.spent(budget) / budget.amountLimit) * 100);
  }

  progressClass(budget: Budget): string {
    const progress = this.progress(budget);
    if (progress >= 100) return 'bg-red-600';
    if (progress >= 80) return 'bg-amber-500';
    return 'bg-emerald-600';
  }

  totalLimit(): number {
    return this.budgets().reduce((sum, budget) => sum + budget.amountLimit, 0);
  }

  totalSpent(): number {
    return this.budgets().reduce((sum, budget) => sum + this.spent(budget), 0);
  }

  private loadReferences(): void {
    this.categoriesService.getAll({ type: { eq: 'expense' } } as any).then(categories => {
      this.categories.set(categories);
    });
  }
}
