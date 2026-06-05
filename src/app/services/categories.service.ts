import { EventEmitter, Injectable } from '@angular/core';
import type { Category, NewCategory } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.CategoriesApi!;
  }

  /** Lista todas as categorias (incluindo subcategorias) */
  getAll(filters?: { type?: string, name?: string }): Promise<Category[]> {
    return this.api.getAll(filters);
  }

  /** Retorna uma categoria pelo ID ou null */
  getById(id: string): Promise<Category | null> {
    return this.api.getById(id);
  }

  /** Cria uma categoria (use parentId para subcategorias) */
  insert(data: NewCategory): Promise<Category> {
    return this.api.insert(data);
  }

  /** Atualiza campos de uma categoria existente */
  update(id: string, data: Partial<NewCategory>): Promise<Category | null> {
    return this.api.update(id, data);
  }

  /** Remove uma categoria (subcategorias terão parentId → null) */
  delete(id: string): Promise<Category | null> {
    return this.api.delete(id);
  }
}
