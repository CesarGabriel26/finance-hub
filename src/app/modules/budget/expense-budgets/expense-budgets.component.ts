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
import {
  budgetBalanceLabel,
  budgetPeriodRange,
  budgetProgress,
  budgetProgressClass,
  budgetTargetLabel,
  remainingBudgetAmount,
  spentInBudget,
} from './expense-budgets.utils';

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
    const { start, end } = budgetPeriodRange(month, year);

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
    return spentInBudget(budget, this.transactions());
  }

  remaining(budget: Budget): number {
    return remainingBudgetAmount(budget, this.transactions());
  }

  progress(budget: Budget): number {
    return budgetProgress(budget, this.transactions());
  }

  progressClass(budget: Budget): string {
    return budgetProgressClass(budget, this.transactions());
  }

  targetLabel(budget: Budget): string {
    return budgetTargetLabel(budget);
  }

  balanceLabel(budget: Budget): string {
    return budgetBalanceLabel(budget);
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
