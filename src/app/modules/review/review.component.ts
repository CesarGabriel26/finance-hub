import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovementService } from '../../services/movement.service';
import { CategoryService } from '../../services/category.service';
import { Movement, Category } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
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

  constructor(
    private movementService: MovementService,
    private categoryService: CategoryService,
    private dialog: DialogService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const [movs, cats] = await Promise.all([
      this.movementService.getMovementsForReview(),
      this.categoryService.getCategories()
    ]);
    this.movements.set(movs);
    this.categories.set(cats);
  }

  async approve(mov: Movement) {
    if (!mov.id) return;
    await this.movementService.updateMovement(mov.id, { 
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
    
    await this.movementService.updateMovement(mov.id, {
      category_id: mov.category_id,
      classification_source: 'manual',
      confidence: 1.0
    });
    
    this.editingMovement.set(null);
    await this.loadData();
  }

  async deleteMovement(id: number) {
    if (await this.dialog.confirm('Excluir este movimento?', 'warning', 'Excluir Movimento')) {
      await this.movementService.deleteMovement(id);
      await this.loadData();
    }
  }
}
