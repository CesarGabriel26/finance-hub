import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsightService } from '../../services/insight.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/database.models';
import { LucideAngularModule, Calculator, AlertTriangle, CheckCircle, XCircle, X, HelpCircle, Save } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-simulator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './simulator-modal.component.html',
  animations: [
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})
export class SimulatorModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() dashboardData: any;
  @Input() period: string = '';
  @Output() close = new EventEmitter<void>();

  private insightService = inject(InsightService);
  private categoryService = inject(CategoryService);

  amount: number | null = null;
  categoryId: number | null = null;
  categories: Category[] = [];
  
  isSimulating = false;
  result: any = null;

  readonly CalculatorIcon = Calculator;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly CloseIcon = X;
  readonly HelpIcon = HelpCircle;
  readonly SaveIcon = Save;

  async ngOnInit() {
    this.categories = (await this.categoryService.getCategories()).filter(c => c.type === 'D');
  }

  async simulate() {
    if (!this.amount || this.amount <= 0) return;
    this.isSimulating = true;
    try {
      this.result = await this.insightService.simulateExpense(
        this.amount, 
        this.categoryId, 
        this.period, 
        this.dashboardData
      );
    } catch (e) {
      console.error(e);
    }
    this.isSimulating = false;
  }

  reset() {
    this.result = null;
    this.amount = null;
    this.categoryId = null;
  }

  closeModal() {
    this.reset();
    this.close.emit();
  }

  apply24hRule() {
    this.closeModal();
    // In actual implementation, we'd trigger a toast or save to Wishlist
  }
}
