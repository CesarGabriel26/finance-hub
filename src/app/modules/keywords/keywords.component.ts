import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeywordService } from '../../services/keyword.service';
import { CategoryService } from '../../services/category.service';
import { MovementService } from '../../services/movement.service';
import { Category, Keyword } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
import { LucideAngularModule, Plus, Trash2, Search, Tag, Edit, X } from 'lucide-angular';

@Component({
  selector: 'app-keywords',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './keywords.component.html',
  styleUrl: './keywords.component.css'
})
export class KeywordsComponent implements OnInit {
  keywords = signal<Keyword[]>([]);
  categories = signal<Category[]>([]);
  
  newKeyword = signal('');
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal('');
  isModalOpen = signal(false);
  editingKeywordId = signal<number | null>(null);
  


  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly SearchIcon = Search;
  readonly TagIcon = Tag;
  readonly EditIcon = Edit;
  readonly CloseIcon = X;

  filteredKeywords = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.keywords();
    return this.keywords().filter(k => 
      k.keyword.toLowerCase().includes(query) || 
      k.category_name?.toLowerCase().includes(query)
    );
  });

  constructor(
    private keywordService: KeywordService,
    private categoryService: CategoryService,
    private movementService: MovementService,
    private dialog: DialogService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const [k, c] = await Promise.all([
      this.keywordService.getKeywords(),
      this.categoryService.getCategories()
    ]);
    this.keywords.set(k);
    this.categories.set(c);
    
    if (c.length > 0 && !this.selectedCategoryId()) {
      this.selectedCategoryId.set(c[0].id!);
    }
  }

  openModal() {
    this.resetForm();
    this.isModalOpen.set(true);
  }

  editKeyword(k: Keyword) {
    this.editingKeywordId.set(k.id!);
    this.newKeyword.set(k.keyword);
    this.selectedCategoryId.set(k.category_id);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.editingKeywordId.set(null);
    this.newKeyword.set('');
    if (this.categories().length > 0) {
      this.selectedCategoryId.set(this.categories()[0].id!);
    }
  }

  async saveKeyword() {
    if (!this.newKeyword().trim() || !this.selectedCategoryId()) return;

    if (this.editingKeywordId()) {
      await this.keywordService.updateKeyword(
        this.editingKeywordId()!,
        this.newKeyword().trim(),
        this.selectedCategoryId()!
      );
    } else {
      await this.keywordService.addKeyword(
        this.newKeyword().trim(), 
        this.selectedCategoryId()!
      );
    }

    await this.movementService.recategorizeMovements();
    this.closeModal();
    await this.loadData();
  }

  async deleteKeyword(id: number) {
    if (await this.dialog.confirm('Tem certeza que deseja excluir esta palavra-chave?', 'warning', 'Excluir Palavra-chave')) {
      await this.keywordService.deleteKeyword(id);
      await this.loadData();
    }
  }
}
