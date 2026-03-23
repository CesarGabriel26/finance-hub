import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Category } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private db = inject(DatabaseService);

  async getCategories(): Promise<Category[]> {
    return this.db.handleApi<Category[]>('getCategories');
  }

  async addCategory(category: Partial<Category>): Promise<any> {
    return this.db.handleApi('addCategory', category);
  }

  async deleteCategory(id: number): Promise<any> {
    return this.db.handleApi('deleteCategory', id);
  }
}
