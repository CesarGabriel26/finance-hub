import { EventEmitter, Injectable } from '@angular/core';
import type { CategoryRule, NewCategoryRule } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryRulesService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.CategoryRulesApi!;
  }

  getAll(): Promise<CategoryRule[]> {
    return this.api.getAll();
  }

  insert(data: NewCategoryRule): Promise<CategoryRule> {
    return this.api.insert(data);
  }

  update(id: string, data: Partial<NewCategoryRule>): Promise<CategoryRule | null> {
    return this.api.update(id, data);
  }

  delete(id: string): Promise<CategoryRule | null> {
    return this.api.delete(id);
  }
}
