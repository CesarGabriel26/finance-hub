import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Category, Keyword } from '../../services/database.service';
import { LucideAngularModule, Plus, Trash2, Search, Tag } from 'lucide-angular';

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
  


  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly SearchIcon = Search;
  readonly TagIcon = Tag;

  constructor(private db: DatabaseService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const [k, c] = await Promise.all([
      this.db.getKeywords(),
      this.db.getCategories()
    ]);
    this.keywords.set(k);
    this.categories.set(c);
    
    if (c.length > 0 && !this.selectedCategoryId()) {
      this.selectedCategoryId.set(c[0].id!);
    }
  }

  async addKeyword() {
    if (!this.newKeyword().trim() || !this.selectedCategoryId()) return;

    await this.db.addKeyword(
      this.newKeyword().trim(), 
      this.selectedCategoryId()!
    );
    this.newKeyword.set('');
    await this.loadData();
  }

  async deleteKeyword(id: number) {
    if (confirm('Tem certeza que deseja excluir esta palavra-chave?')) {
      await this.db.deleteKeyword(id);
      await this.loadData();
    }
  }
}
