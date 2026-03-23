import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  newCategoryName = signal('');
  newCategoryType = signal<'D' | 'C'>('D');

  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;

  constructor(private categoryService: CategoryService, private dialog: DialogService) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    this.categories.set(await this.categoryService.getCategories())
  }

  async addCategory() {
    if (!this.newCategoryName().trim()) return;
    await this.categoryService.addCategory({
      name: this.newCategoryName().trim(),
      type: this.newCategoryType()
    });
    this.newCategoryName.set('');
    this.newCategoryType.set('D');
    this.loadCategories();
  }

  async deleteCategory(id: number) {
    if (await this.dialog.confirm('Tem certeza que deseja excluir esta categoria?', 'warning', 'Excluir Categoria')) {
      await this.categoryService.deleteCategory(id);
      this.loadCategories();
    }
  }
}
