import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { AccountService } from '../../services/account.service';
import { CategoryService } from '../../services/category.service';
import { Bill, Account, Category } from '../../models/database.models';
import { DialogService } from '../../services/dialog.service';
import { LucideAngularModule, Plus, Trash2, CheckCircle, Calendar, CreditCard, Repeat, Layers } from 'lucide-angular';

@Component({
  selector: 'app-payable',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payable.component.html',
})
export class PayableComponent implements OnInit {
  bills = signal<Bill[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);
  
  showAddForm = signal(false);
  payingBill = signal<Bill | null>(null);

  // Form fields
  nbDescription = '';
  nbAmount: number | null = null;
  nbDueDate = new Date().toISOString().split('T')[0];
  nbCategoryId: number | null = null;
  nbIsRecurring = false;
  nbRecurrenceClassification: 'fixed' | 'variable' | null = null;
  nbTotalInstallments = 1;

  // Payment fields
  selectedAccountId = signal<number | null>(null);
  paymentDate = new Date().toISOString().split('T')[0];

  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly CheckCircleIcon = CheckCircle;
  readonly CalendarIcon = Calendar;
  readonly CreditCardIcon = CreditCard;
  readonly RepeatIcon = Repeat;
  readonly LayersIcon = Layers;

  constructor(
    private billService: BillService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private dialog: DialogService
  ) {}

  async ngOnInit() {
    this.refresh();
    this.accounts.set(await this.accountService.getAccounts());
    this.categories.set(await this.categoryService.getCategories());
    if (this.accounts().length > 0) {
        this.selectedAccountId.set(this.accounts()[0].id!);
    }
  }

  async refresh() {
    this.bills.set(await this.billService.getBills('D', 'pending'));
  }

  expenseCategories() {
    return this.categories().filter(c => c.type === 'D');
  }

  async addBill() {
    if (!this.nbDescription || !this.nbAmount || !this.nbDueDate) {
        await this.dialog.warning('Preencha os campos obrigatórios.', 'Campos Obrigatórios');
        return;
    }

    await this.billService.addBill({
      description: this.nbDescription,
      amount: this.nbAmount,
      due_date: this.nbDueDate,
      type: 'D',
      category_id: this.nbCategoryId,
      is_recurring: this.nbIsRecurring,
      recurrence_classification: this.nbIsRecurring ? this.nbRecurrenceClassification : null,
      total_installments: this.nbTotalInstallments,
      current_installment: 1,
      status: 'pending'
    });

    this.showAddForm.set(false);
    this.resetForm();
    this.refresh();
  }

  resetForm() {
    this.nbDescription = '';
    this.nbAmount = null;
    this.nbDueDate = new Date().toISOString().split('T')[0];
    this.nbCategoryId = null;
    this.nbIsRecurring = false;
    this.nbRecurrenceClassification = null;
    this.nbTotalInstallments = 1;
  }

  async deleteBill(id: number) {
    if (await this.dialog.confirm('Excluir esta conta?', 'warning', 'Excluir Conta')) {
      await this.billService.deleteBill(id);
      this.refresh();
    }
  }

  openPaymentModal(bill: Bill) {
    this.payingBill.set(bill);
    this.paymentDate = new Date().toISOString().split('T')[0];
  }

  async confirmPayment() {
    const bill = this.payingBill();
    if (!bill || !this.selectedAccountId()) return;

    await this.billService.payBill({
        billId: bill.id!,
        accountId: this.selectedAccountId()!,
        paymentDate: this.paymentDate
    });

    this.payingBill.set(null);
    this.refresh();
    // Refresh accounts balance if needed (optional since we reload on init, but good practice)
    this.accounts.set(await this.accountService.getAccounts());
  }
}
