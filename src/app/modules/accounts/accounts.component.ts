import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Account } from '../../services/database.service';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

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

  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;

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
}
