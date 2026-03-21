import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Movement, Category } from '../../services/database.service';
import { LucideAngularModule, Check, Edit2, Trash2, AlertCircle, Brain, Info, X, Wallet } from 'lucide-angular';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './review.component.html',
  styleUrl: './review.component.css'
})
export class ReviewComponent implements OnInit {
  movements = signal<Movement[]>([]);
  categories = signal<Category[]>([]);


  editingMovement = signal<Movement | null>(null);

  readonly CheckIcon = Check;
  readonly EditIcon = Edit2;
  readonly TrashIcon = Trash2;
  readonly AlertIcon = AlertCircle;
  readonly BrainIcon = Brain;
  readonly InfoIcon = Info;
  readonly XIcon = X;
  readonly WalletIcon = Wallet;

  constructor(private db: DatabaseService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const [movs, cats] = await Promise.all([
      this.db.getMovementsForReview(),
      this.db.getCategories()
    ]);
    this.movements.set(movs);
    this.categories.set(cats);
  }

  async approve(mov: Movement) {
    if (!mov.id) return;
    await this.db.updateMovement(mov.id, { 
      classification_source: 'manual', 
      confidence: 1.0 
    });
    await this.loadData();
  }

  openEditModal(mov: Movement) {
    this.editingMovement.set({ ...mov });
  }

  async saveEdit() {
    const mov = this.editingMovement();
    if (!mov || !mov.id) return;
    
    await this.db.updateMovement(mov.id, {
      category_id: mov.category_id,
      classification_source: 'manual',
      confidence: 1.0
    });
    
    this.editingMovement.set(null);
    await this.loadData();
  }

  async deleteMovement(id: number) {
    if (confirm('Excluir este movimento?')) {
      await this.db.deleteMovement(id);
      await this.loadData();
    }
  }
}
