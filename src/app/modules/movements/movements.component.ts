import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Movement, Account, Category } from '../../services/database.service';
import { LucideAngularModule, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Lock, Edit2, Brain, Check, X, Info } from 'lucide-angular';

@Component({
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.css'
})
export class MovementsComponent implements OnInit {
  // use signals
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);
  movements = signal<Movement[]>([]);

  selectedAccountId = signal<number | null>(null);
  selectedPeriod = signal(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Individual signals for the new movement form
  nmDescription = signal('');
  nmAmount = signal<number | null>(null);
  nmType = signal<'D' | 'C'>('D');
  nmCategoryId = signal<number | undefined>(undefined);

  // Edit State
  editingMovement = signal<Movement | null>(null);
  showLearningPrompt = signal(false);

  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly UpIcon = ArrowUpCircle;
  readonly DownIcon = ArrowDownCircle;
  readonly LockIcon = Lock;
  readonly EditIcon = Edit2;
  readonly BrainIcon = Brain;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly InfoIcon = Info;

  constructor(private db: DatabaseService) { }

  async ngOnInit() {
    const [accs, cats] = await Promise.all([
      this.db.getAccounts(),
      this.db.getCategories()
    ]);
    this.accounts.set(accs);
    this.categories.set(cats);

    if (this.accounts().length > 0) {
      this.selectedAccountId.set(this.accounts()[0].id!);
      this.loadMovements();
    }
  }

  async loadMovements() {
    if (!this.selectedAccountId() || !this.selectedPeriod()) return;
    this.movements.set(await this.db.getMovements(this.selectedAccountId()!, this.selectedPeriod()));
  }

  get expenseCategories() {
    return this.categories().filter(c => c.type === 'D');
  }

  get revenueCategories() {
    return this.categories().filter(c => c.type === 'C');
  }

  get displayedCategories() {
    return this.nmType() === 'D' ? this.expenseCategories : this.revenueCategories;
  }

  async addMovement() {
    const accId = this.selectedAccountId();
    const amount = this.nmAmount();
    const desc = this.nmDescription();

    if (!accId || !amount || !desc) return;

    await this.db.addMovement({
      account_id: accId,
      category_id: this.nmCategoryId(),
      description: desc,
      amount: amount,
      period: this.selectedPeriod(),
      date: new Date().toISOString(),
      type: this.nmType(),
      classification_source: 'manual',
      confidence: 1.0
    });

    this.nmDescription.set('');
    this.nmAmount.set(null);
    this.loadMovements();
  }

  async deleteMovement(id: number, type: string) {
    if (type === 'AC' || type === 'FC') {
      alert('Não é possível excluir abertura ou fechamento de conta diretamente.');
      return;
    }
    if (confirm('Excluir este movimento? O saldo da conta será recalculado.')) {
      await this.db.deleteMovement(id);
      this.loadMovements();
    }
  }

  openEditModal(mov: Movement) {
    this.editingMovement.set({ ...mov }); // Clone
  }

  async saveEdit() {
    const mov = this.editingMovement();
    if (!mov || !mov.id) return;

    // Check if category was changed
    const original = this.movements().find(m => m.id === mov.id);
    const wasAuto = original?.classification_source === 'keyword' || original?.classification_source === 'imported';
    const changed = original?.category_id !== mov.category_id || original?.amount !== mov.amount;

    await this.db.updateMovement(mov.id, {
      category_id: mov.category_id,
      description: mov.description,
      amount: mov.amount,
      classification_source: 'manual'
    });

    if (wasAuto && changed) {
      this.showLearningPrompt.set(true);
    } else {
      this.editingMovement.set(null);
    }
    
    this.loadMovements();
  }

  async applyLearningRule() {
    const mov = this.editingMovement();
    if (!mov) return;

    await this.db.addKeywordRule({
      keyword: mov.description,
      category_id: mov.category_id!,
      priority: 10,
      created_by_user: true
    });

    await this.db.recategorizeMovements();

    this.showLearningPrompt.set(false);
    this.editingMovement.set(null);
  }

  cancelEdit() {
    this.editingMovement.set(null);
    this.showLearningPrompt.set(false);
  }

  async closePeriod() {
    if (!this.selectedAccountId()) return;
    if (confirm('Deseja fechar o mês? Isso vai gerar o registro de Fechamento (FC).')) {
      await this.db.closePeriod(this.selectedAccountId()!, this.selectedPeriod());
      this.loadMovements();
    }
  }
}
