import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryRule, NewCategoryRule } from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { CategoriesService } from '../../../services/categories.service';
import { CategoryRulesService } from '../../../services/category-rules.service';

@Component({
  selector: 'app-category-rules',
  imports: [CommonModule, ReactiveFormsModule, InputComponent, SelectComponent],
  templateUrl: './category-rules.component.html',
  styleUrl: './category-rules.component.css',
})
export class CategoryRulesComponent implements OnInit {
  rules = signal<CategoryRule[]>([]);
  categories = signal<Category[]>([]);
  categoryOptions = signal<SelectOption[]>([]);
  editingRule = signal<CategoryRule | null>(null);
  searchQuery = signal('');
  search = new FormControl<string>('', { nonNullable: true });

  form = new FormGroup({
    keyword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    categoryId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl<number>(0, { nonNullable: true }),
  });

  filteredRules = computed(() => {
    const query = this.normalize(this.searchQuery());
    if (!query) return this.rules();

    return this.rules().filter(rule =>
      this.normalize(rule.keyword).includes(query) ||
      this.normalize(rule.categoryName).includes(query)
    );
  });

  constructor(
    private categoriesService: CategoriesService,
    private categoryRulesService: CategoryRulesService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.search.valueChanges.subscribe(value => this.searchQuery.set(value));
    this.categoryRulesService.updated.subscribe(() => this.loadRules());
  }

  submit(event: Event): void {
    event.preventDefault();

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: NewCategoryRule = {
      keyword: raw.keyword.trim(),
      categoryId: raw.categoryId,
      priority: Number(raw.priority) || 0,
      createdByUser: true,
    };
    const editing = this.editingRule();
    const save = editing
      ? this.categoryRulesService.update(editing.id, payload)
      : this.categoryRulesService.insert(payload);

    save.then(() => {
      this.categoryRulesService.updated.emit();
      this.resetForm();
    });
  }

  edit(rule: CategoryRule): void {
    this.editingRule.set(rule);
    this.form.patchValue({
      keyword: rule.keyword,
      categoryId: rule.categoryId,
      priority: rule.priority,
    });
  }

  delete(rule: CategoryRule): void {
    this.categoryRulesService.delete(rule.id).then(() => {
      this.categoryRulesService.updated.emit();
      if (this.editingRule()?.id === rule.id) {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.editingRule.set(null);
    this.form.reset({
      keyword: '',
      categoryId: this.categoryOptions()[0]?.value ?? '',
      priority: 0,
    });
  }

  categoryTypeLabel(rule: CategoryRule): string {
    return rule.categoryType === 'income' ? 'Receita' : 'Despesa';
  }

  private load(): void {
    Promise.all([
      this.categoriesService.getAll(),
      this.categoryRulesService.getAll(),
    ]).then(([categories, rules]) => {
      this.categories.set(categories);
      this.categoryOptions.set(categories.map(category => ({
        value: category.id,
        label: `${category.name} (${category.type === 'income' ? 'Receita' : 'Despesa'})`,
        icon: category.icon ?? undefined,
      })));
      this.rules.set(rules);

      if (!this.form.controls.categoryId.value && this.categoryOptions()[0]) {
        this.form.patchValue({ categoryId: this.categoryOptions()[0].value });
      }
    });
  }

  private loadRules(): void {
    this.categoryRulesService.getAll().then(rules => this.rules.set(rules));
  }

  private normalize(value?: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
