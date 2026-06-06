import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { Category, CategoryRule, NewCategoryRule } from '../../../models';
import type { SelectOption } from '../../../components/select/select.component';

export type CategoryRuleForm = FormGroup<{
  keyword: FormControl<string>;
  categoryId: FormControl<string>;
  priority: FormControl<number>;
}>;

export function createCategoryRuleSearchControl(): FormControl<string> {
  return new FormControl('', { nonNullable: true });
}

export function createCategoryRuleForm(): CategoryRuleForm {
  return new FormGroup({
    keyword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    categoryId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priority: new FormControl(0, { nonNullable: true }),
  });
}

export function buildCategoryRulePayload(raw: CategoryRuleForm['value']): NewCategoryRule {
  return {
    keyword: (raw.keyword ?? '').trim(),
    categoryId: raw.categoryId ?? '',
    priority: Number(raw.priority) || 0,
    createdByUser: true,
  };
}

export function categoryOptions(categories: Category[]): SelectOption[] {
  return categories.map(category => ({
    value: category.id,
    label: `${category.name} (${category.type === 'income' ? 'Receita' : 'Despesa'})`,
    icon: category.icon ?? undefined,
  }));
}

export function filteredCategoryRules(
  rules: CategoryRule[],
  query: string,
): CategoryRule[] {
  const normalizedQuery = normalizeCategoryRuleText(query);
  if (!normalizedQuery) return rules;

  return rules.filter(rule =>
    normalizeCategoryRuleText(rule.keyword).includes(normalizedQuery) ||
    normalizeCategoryRuleText(rule.categoryName).includes(normalizedQuery)
  );
}

export function categoryTypeLabel(rule: CategoryRule): string {
  return rule.categoryType === 'income' ? 'Receita' : 'Despesa';
}

function normalizeCategoryRuleText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
