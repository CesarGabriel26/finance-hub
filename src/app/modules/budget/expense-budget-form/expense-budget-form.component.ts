import { Component, Input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Budget, Category, NewBudget } from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { BudgetsService } from '../../../services/budgets.service';
import { CategoriesService } from '../../../services/categories.service';
import { ModalService } from '../../../services/modal.service';
import { buildExpenseBudgetPayload } from './expense-budget-form.utils';

@Component({
  selector: 'app-expense-budget-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './expense-budget-form.component.html',
  styleUrl: './expense-budget-form.component.css',
})
export class ExpenseBudgetFormComponent implements OnInit {
  @Input() budget?: Budget;
  @Input() month = new Date().getMonth() + 1;
  @Input() year = new Date().getFullYear();

  categoryOptions = signal<SelectOption[]>([]);
  categories = signal<Category[]>([]);

  form = new FormGroup({
    categoryId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amountLimit: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    targetKind: new FormControl<'maximum' | 'minimum'>('maximum', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    alertPercent: new FormControl<number>(80, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(
    private budgetsService: BudgetsService,
    private categoriesService: CategoriesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.categoriesService.getAll({ type: { eq: 'expense' } } as any).then(categories => {
      this.categories.set(categories);
      this.categoryOptions.set(categories.map(category => ({
        value: category.id,
        label: category.name,
        icon: category.icon ?? undefined,
      })));

      if (!this.budget && categories[0]) {
        this.form.patchValue({ categoryId: categories[0].id });
      }
    });

    if (this.budget) {
      this.form.patchValue({
        categoryId: this.budget.categoryId,
        amountLimit: this.budget.amountLimit,
        targetKind: this.budget.targetKind ?? 'maximum',
        alertPercent: this.budget.alertPercent ?? 80,
        notes: this.budget.notes ?? '',
      });
    }
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewBudget = buildExpenseBudgetPayload(raw, {
      budget: this.budget,
      month: this.month,
      year: this.year,
    });

    const save = this.budget?.id
      ? this.budgetsService.update(this.budget.id, payload)
      : this.budgetsService.insert(payload);

    save.then(() => {
      this.budgetsService.updated.emit();
      this.modalService.close();
    });
  }
}
