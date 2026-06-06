import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Category, CategoryRule } from '../../../models';
import { InputComponent } from '../../../components/input/input.component';
import { SelectComponent, SelectOption } from '../../../components/select/select.component';
import { CategoriesService } from '../../../services/categories.service';
import { CategoryRulesService } from '../../../services/category-rules.service';
import {
  buildCategoryRulePayload,
  categoryOptions,
  categoryTypeLabel,
  createCategoryRuleForm,
  createCategoryRuleSearchControl,
  filteredCategoryRules,
} from './category-rules.utils';

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
  search = createCategoryRuleSearchControl();
  form = createCategoryRuleForm();

  filteredRules = computed(() => {
    return filteredCategoryRules(this.rules(), this.searchQuery());
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

    const payload = buildCategoryRulePayload(this.form.getRawValue());
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
    return categoryTypeLabel(rule);
  }

  private load(): void {
    Promise.all([
      this.categoriesService.getAll(),
      this.categoryRulesService.getAll(),
    ]).then(([categories, rules]) => {
      this.categories.set(categories);
      this.categoryOptions.set(categoryOptions(categories));
      this.rules.set(rules);

      if (!this.form.controls.categoryId.value && this.categoryOptions()[0]) {
        this.form.patchValue({ categoryId: this.categoryOptions()[0].value });
      }
    });
  }

  private loadRules(): void {
    this.categoryRulesService.getAll().then(rules => this.rules.set(rules));
  }
}
