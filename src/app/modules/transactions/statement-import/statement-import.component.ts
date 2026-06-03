import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { readOfx } from '../../../utils/ofx-reader';

interface ImportTransaction {
  id: string;
  date: Date;
  description: string;
  originalDescription: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  ignored: boolean;
}

interface BankAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  logo: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-statement-import.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './statement-import.component.html',
  styleUrl: './statement-import.component.css',
})
export class StatementImportComponent {
  // ── UI state ──────────────────────────────────────────────
  readonly isDragging = signal(false);
  readonly isLoading  = signal(false);

  // ── File / parse state ────────────────────────────────────
  readonly fileName      = signal('');
  readonly fileSize      = signal('');
  readonly bankName      = signal('');
  readonly accountNumber = signal('');
  readonly periodStart   = signal<Date | null>(null);
  readonly periodEnd     = signal<Date | null>(null);

  // ── Transactions ──────────────────────────────────────────
  readonly parsedTransactions = signal<ImportTransaction[]>([]);

  // ── Toast / confirmation ──────────────────────────────────
  readonly showSuccessToast = signal(false);
  readonly importedCount    = signal(0);

  // ── Account selection ─────────────────────────────────────
  readonly selectedAccountId = signal('1');

  // ── Static data ───────────────────────────────────────────
  readonly accounts: BankAccount[] = [
    { id: '1', name: 'Nubank',          icon: 'account_balance', color: 'bg-purple-600', logo: '🟣' },
    { id: '2', name: 'Itaú',            icon: 'account_balance', color: 'bg-orange-500', logo: '🟠' },
    { id: '3', name: 'Banco Inter',     icon: 'account_balance', color: 'bg-orange-600', logo: '🟡' },
    { id: '4', name: 'Banco do Brasil', icon: 'account_balance', color: 'bg-yellow-400', logo: '🔵' },
  ];

  readonly categories: Category[] = [
    { id: '1', name: 'Alimentação', icon: 'fastfood',               color: 'text-amber-500 bg-amber-50' },
    { id: '2', name: 'Transporte',  icon: 'directions_car',         color: 'text-blue-500 bg-blue-50' },
    { id: '3', name: 'Moradia',     icon: 'home',                   color: 'text-indigo-500 bg-indigo-50' },
    { id: '4', name: 'Receitas',    icon: 'account_balance_wallet',  color: 'text-emerald-500 bg-emerald-50' },
    { id: '5', name: 'Lazer',       icon: 'sports_esports',         color: 'text-pink-500 bg-pink-50' },
    { id: '6', name: 'Saúde',       icon: 'medical_services',       color: 'text-rose-500 bg-rose-50' },
    { id: '7', name: 'Outros',      icon: 'payments',               color: 'text-slate-500 bg-slate-100' },
  ];

  // ── Computed (derived) state ──────────────────────────────
  readonly selectedAccountName = computed(() =>
    this.accounts.find(a => a.id === this.selectedAccountId())?.name ?? ''
  );

  readonly activeTx = computed(() =>
    this.parsedTransactions().filter(tx => !tx.ignored)
  );

  readonly totalIncome = computed(() =>
    this.activeTx()
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly totalExpense = computed(() =>
    this.activeTx()
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly totalTransactionsCount = computed(() => this.activeTx().length);

  readonly isAllSelected = computed(() => {
    const txs = this.parsedTransactions();
    return txs.length > 0 && txs.every(tx => !tx.ignored);
  });

  // ── Drag & drop ───────────────────────────────────────────
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) await this.processFile(files[0]);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) await this.processFile(files[0]);
  }

  // ── File processing ───────────────────────────────────────
  async processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.ofx')) {
      alert('Por favor, selecione um arquivo no formato .OFX');
      return;
    }

    this.isLoading.set(true);
    this.fileName.set(file.name);
    this.fileSize.set(this.formatBytes(file.size));

    try {
      const normalizedData = await readOfx(file);

      if (!normalizedData?.transactions) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX.');
      }

      const transactions: ImportTransaction[] = normalizedData.transactions.map((tx, idx) => {
        const rawAmount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : (tx.amount ?? 0);
        const direction: 'credit' | 'debit' = tx.direction === 'credit' || rawAmount > 0 ? 'credit' : 'debit';
        const parsedDate = tx.postedAt ? new Date(tx.postedAt) : new Date();
        const description = tx.descriptionNormalized || tx.description || 'Transação sem descrição';

        return {
          id: tx.fitId || `tx-${Date.now()}-${idx}`,
          date: parsedDate,
          description: this.capitalizeWords(description),
          originalDescription: tx.description ?? '',
          amount: Math.abs(rawAmount),
          type: direction,
          category: this.autoCategorize(description),
          ignored: false,
        };
      });

      // Sort newest first
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      this.parsedTransactions.set(transactions);

      // Metadata
      const firstTx = normalizedData.transactions[0];
      this.bankName.set(firstTx?.institution?.['org'] || 'Banco Importado');
      this.accountNumber.set(firstTx?.account?.['accountId'] || '—');

      // Date range
      const dates = transactions.map(t => t.date.getTime());
      this.periodStart.set(new Date(Math.min(...dates)));
      this.periodEnd.set(new Date(Math.max(...dates)));

      // Auto-detect destination account by bank name
      const detected = this.accounts.find(
        acc => this.bankName().toLowerCase().includes(acc.name.toLowerCase())
      );
      if (detected) this.selectedAccountId.set(detected.id);

    } catch (error) {
      console.error('Erro ao ler arquivo OFX:', error);
      alert('Ocorreu um erro ao processar o arquivo OFX. Verifique se o arquivo está correto.');
      this.resetImport();
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Transaction mutations ─────────────────────────────────
  setTransactionCategory(txId: string, categoryName: string) {
    this.parsedTransactions.update(txs =>
      txs.map(tx => tx.id === txId ? { ...tx, category: categoryName } : tx)
    );
  }

  toggleIgnore(txId: string) {
    this.parsedTransactions.update(txs =>
      txs.map(tx => tx.id === txId ? { ...tx, ignored: !tx.ignored } : tx)
    );
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.parsedTransactions.update(txs =>
      txs.map(tx => ({ ...tx, ignored: !checked }))
    );
  }

  // ── Import confirmation ───────────────────────────────────
  confirmImport() {
    const count = this.activeTx().length;
    if (count === 0) {
      alert('Nenhuma transação selecionada para importação.');
      return;
    }
    this.importedCount.set(count);
    this.showSuccessToast.set(true);
    setTimeout(() => {
      this.showSuccessToast.set(false);
      this.resetImport();
    }, 4500);
  }

  // ── Reset ─────────────────────────────────────────────────
  resetImport() {
    this.parsedTransactions.set([]);
    this.fileName.set('');
    this.fileSize.set('');
    this.bankName.set('');
    this.accountNumber.set('');
    this.periodStart.set(null);
    this.periodEnd.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────
  autoCategorize(desc: string): string {
    const d = desc.toLowerCase();
    if (/uber|99taxis|cabify|posto|combustivel|pedagio|gasolina/.test(d))                                    return 'Transporte';
    if (/ifood|restaurante|mcdonald|cafe|starbucks|padaria|supermercado|carrefour|bistr|alimento|\bbar\b/.test(d)) return 'Alimentação';
    if (/aluguel|condominio|\bluz\b|energia|copasa|cemig|sabesp|internet|claro|vivo|\btim\b|\bgas\b/.test(d)) return 'Moradia';
    if (/salario|salário|recebido|rendimento|provento/.test(d))                                              return 'Receitas';
    if (/netflix|spotify|steam|cinema|hbo|disney|ingresso|\bjogo\b|lazer|shopping|livraria/.test(d))        return 'Lazer';
    if (/farmacia|drogaria|hospital|medico|consulta|exame|saude|dentista/.test(d))                          return 'Saúde';
    return 'Outros';
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(Math.max(0, decimals))) + ' ' + sizes[i];
  }

  capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getCategoryIcon(categoryName: string): string {
    return this.categories.find(c => c.name === categoryName)?.icon ?? 'payments';
  }

  getCategoryColorClass(categoryName: string): string {
    return this.categories.find(c => c.name === categoryName)?.color ?? 'text-slate-500 bg-slate-100';
  }
}
