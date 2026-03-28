import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
import { LucideAngularModule, Plus, Trash2, Edit, Search, X } from 'lucide-angular';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
    categories = signal<Category[]>([]);
    searchQuery = signal('');
    isModalOpen = signal(false);

    newCategoryName = signal('');
    newCategoryType = signal<'D' | 'C'>('D');
    newCategoryIsFixed = signal(false);
    editingCategoryId = signal<number | null>(null);

    filteredCategories = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return this.categories();
        return this.categories().filter(cat =>
            cat.name.toLowerCase().includes(query)
        );
    });

    readonly PlusIcon = Plus;
    readonly TrashIcon = Trash2;
    readonly EditIcon = Edit;
    readonly SearchIcon = Search;
    readonly CloseIcon = X;

    constructor(private categoryService: CategoryService, private dialog: DialogService) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    async loadCategories() {
        this.categories.set(await this.categoryService.getCategories())
    }

    async saveCategory() {
        if (!this.newCategoryName().trim()) return;

        const categoryData: Partial<Category> = {
            name: this.newCategoryName().trim(),
            type: this.newCategoryType(),
            is_fixed: this.newCategoryType() === 'D' ? this.newCategoryIsFixed() : false
        };

        if (this.editingCategoryId()) {
            await this.categoryService.updateCategory(this.editingCategoryId()!, categoryData);
        } else {
            await this.categoryService.addCategory(categoryData);
        }

        this.closeModal();
        this.loadCategories();
    }

    openModal() {
        this.resetForm();
        this.isModalOpen.set(true);
    }

    editCategory(cat: Category) {
        this.editingCategoryId.set(cat.id || null);
        this.newCategoryName.set(cat.name);
        this.newCategoryType.set(cat.type);
        this.newCategoryIsFixed.set(!!cat.is_fixed);
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.resetForm();
    }

    cancelEdit() {
        this.closeModal();
    }

    private resetForm() {
        this.editingCategoryId.set(null);
        this.newCategoryName.set('');
        this.newCategoryType.set('D');
        this.newCategoryIsFixed.set(false);
    }

    async deleteCategory(id: number) {
        if (await this.dialog.confirm('Tem certeza que deseja excluir esta categoria?', 'warning', 'Excluir Categoria')) {
            await this.categoryService.deleteCategory(id);
            this.loadCategories();
        }
    }
}
