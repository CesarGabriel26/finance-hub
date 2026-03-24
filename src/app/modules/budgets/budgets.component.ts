import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { DashboardService } from '../../services/dashboard.service';
import { Budget, Category } from '../../models/database.models';
import { LucideAngularModule, ChevronLeft, ChevronRight, Save, Info, AlertTriangle, CheckCircle } from 'lucide-angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './budgets.component.html'
})
export class BudgetsComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private dashboardService = inject(DashboardService);
  private toastService = inject(ToastService);

  categories = signal<Category[]>([]);
  budgets = signal<Budget[]>([]);
  
  selectedDate = signal(new Date());
  
  month = computed(() => this.selectedDate().getMonth() + 1);
  year = computed(() => this.selectedDate().getFullYear());
  period = computed(() => `${this.year()}-${this.month().toString().padStart(2, '0')}`);

  expensesByCategory = signal<Record<string, number>>({});

  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly SaveIcon = Save;
  readonly InfoIcon = Info;
  readonly AlertIcon = AlertTriangle;
  readonly CheckIcon = CheckCircle;

  constructor() {
    effect(() => {
      this.loadData();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    const cats = await this.categoryService.getCategories();
    this.categories.set(cats.filter(c => c.type === 'D'));
  }

  async loadData() {
    const periodStr = this.period();
    const [y, m] = periodStr.split('-').map(Number);
    
    // Get budgets for this month
    const currentBudgets = await this.budgetService.getBudgets(m, y);
    this.budgets.set(currentBudgets);

    // Get actual spent data for the period
    const dashboardData = await this.dashboardService.getDashboardData(periodStr);
    const processed = this.dashboardService.processDashboardData(dashboardData);
    this.expensesByCategory.set(processed.expensesByCategory);
  }

  getBudgetForCategory(categoryId: number): Budget | undefined {
    return this.budgets().find(b => b.category_id === categoryId);
  }

  getSpentForCategory(categoryName: string): number {
    return this.expensesByCategory()[categoryName] || 0;
  }

  async saveBudget(category: Category, limit: number) {
    if (limit < 0) return;
    
    try {
      await this.budgetService.addBudget({
        category_id: category.id!,
        monthly_limit: limit,
        month: this.month(),
        year: this.year(),
        alert_threshold_percentage: 80
      });
      this.toastService.show('Orçamento salvo com sucesso!', 'success');
      this.loadData();
    } catch (error) {
      console.error('Error saving budget', error);
      this.toastService.show('Erro ao salvar orçamento.', 'error');
    }
  }

  changeMonth(delta: number) {
    const next = new Date(this.selectedDate());
    next.setMonth(next.getMonth() + delta);
    this.selectedDate.set(next);
  }

  calculatePercent(spent: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  }

  getStatus(spent: number, limit: number): 'safe' | 'warning' | 'exceeded' {
    return this.budgetService.calculateStatus(spent, limit);
  }

  getStatusColor(spent: number, limit: number): string {
    return this.budgetService.getBudgetStatusColor(spent, limit);
  }

  getProgressColor(spent: number, limit: number): string {
    return this.budgetService.getBudgetProgressColor(spent, limit);
  }
}
