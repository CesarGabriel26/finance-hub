import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Account } from '../../services/database.service';
import { LucideAngularModule, Plus, Trash2, Edit2, Check, X } from 'lucide-angular';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  accounts = signal<Account[]>([]);
  newAccountName = signal('');
  newAccountBalance = signal(0);
  editingAccount = signal<Account | null>(null);

  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly EditIcon = Edit2;
  readonly CheckIcon = Check;
  readonly XIcon = X;

  constructor(private db: DatabaseService) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  async loadAccounts() {
    this.accounts.set(await this.db.getAccounts());
  }

  async addAccount() {
    if (!this.newAccountName().trim()) return;
    await this.db.addAccount({
      name: this.newAccountName().trim(),
      balance: this.newAccountBalance()
    });
    this.newAccountName.set('');
    this.newAccountBalance.set(0);
    this.loadAccounts();
  }

  async deleteAccount(id: number) {
    if (confirm('Tem certeza que deseja excluir esta conta? Isso pode quebrar movimentos associados se o banco não usar CASCADE.')) {
      await this.db.deleteAccount(id);
      this.loadAccounts();
    }
  }

  startEdit(account: Account) {
    this.editingAccount.set({ ...account });
  }

  cancelEdit() {
    this.editingAccount.set(null);
  }

  async saveEdit() {
    const edit = this.editingAccount();
    if (!edit || !edit.id || !edit.name.trim()) return;

    await this.db.updateAccountName(edit.id, edit.name.trim());
    this.editingAccount.set(null);
    this.loadAccounts();
  }
}
