import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { formatBytes, parseAndNormalizeOfx } from '../../../utils/helpers/ofx-parser.helper';
import { autoCategorize } from '../../../utils/helpers/category-rule.helper';
import { Account, AccountType, Category, CategoryRule, ImportedTransaction } from '../../../models';
import { OfxParseResult } from '../../../models/ofx.model';
import { AccountsService } from '../../../services/accounts.service';
import { AccountStatementBalancesService } from '../../../services/account-statement-balances.service';
import { BankService } from '../../../services/banks.service';
import { CategoryRulesService } from '../../../services/category-rules.service';
import { CategoriesService } from '../../../services/categories.service';
import { TransactionsService } from '../../../services/transactions.service';

@Component({
  selector: 'app-statement-import',
  imports: [CommonModule, FormsModule, DataTableComponent, DatePipe],
  templateUrl: './statement-import.component.html',
  styleUrl: './statement-import.component.css',
})
export class StatementImportComponent implements OnInit {
  private readonly accountsService = inject(AccountsService);
  private readonly statementBalancesService = inject(AccountStatementBalancesService);
  private readonly bankService = inject(BankService);
  private readonly categoryRulesService = inject(CategoryRulesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly transactionsService = inject(TransactionsService);

  // ── Definição de Colunas da Tabela ────────────────────────
  readonly transactionColumns: DataTableColumn<ImportedTransaction>[] = [
    { key: 'select', label: '', width: '40px' },
    { key: 'description', label: 'Transação' },
    { key: 'category', label: 'Categoria', width: '220px' },
    { key: 'date', label: 'Data', width: '120px' },
    { key: 'amount', label: 'Valor', align: 'right', width: '130px' },
    { key: 'actions', label: '', align: 'right', width: '60px' },
  ];

  // ── Estados Reativos (Signals) ────────────────────────────
  readonly categories = signal<Category[]>([]);
  readonly categoryRules = signal<CategoryRule[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly isDragging = signal(false);
  readonly isLoading = signal(false);
  readonly fileName = signal('');
  readonly fileSize = signal('');
  readonly bankName = signal('');
  readonly bankCode = signal('');
  readonly accountNumber = signal('');
  readonly accountType = signal<AccountType>('checking');
  readonly accountAutomationMessage = signal('');
  readonly periodStart = signal<Date | null>(null);
  readonly periodEnd = signal<Date | null>(null);
  readonly statementPeriod = signal('');
  readonly initialBalance = signal<number | null>(null);
  readonly finalBalance = signal<number | null>(null);
  readonly balanceDate = signal<Date | null>(null);
  readonly statementTotalCredits = signal(0);
  readonly statementTotalDebits = signal(0);
  readonly statementNetAmount = signal(0);

  readonly parsedTransactions = signal<ImportedTransaction[]>([]);
  readonly selectedAccountId = signal('');

  // ── Estados Derivados (Computed) ──────────────────────────
  readonly selectedAccountName = computed(() =>
    this.accounts().find(a => a.id === this.selectedAccountId())?.name ?? 'Nenhuma selecionada'
  );

  readonly activeTx = computed(() =>
    this.parsedTransactions()
  );

  readonly totalIncome = computed(() =>
    this.activeTx()
      .filter(tx => !tx.ignored && tx.direction === 'credit')
      .reduce((sum, tx) => sum + (tx.amountAbs ?? 0), 0)
  );

  readonly totalExpense = computed(() =>
    this.activeTx()
      .filter(tx => !tx.ignored && tx.direction === 'debit')
      .reduce((sum, tx) => sum + (tx.amountAbs ?? 0), 0)
  );

  readonly totalTransactionsCount = computed(() =>
    this.activeTx().filter(tx => !tx.ignored).length
  );

  readonly duplicateTransactionsCount = computed(() =>
    this.parsedTransactions().filter(tx => tx.duplicate).length
  );

  readonly uncategorizedTransactionsCount = computed(() =>
    this.activeTx().filter(tx => !tx.ignored && !tx.categoryId).length
  );

  readonly isAllSelected = computed(() => {
    const txs = this.parsedTransactions();
    return txs.length > 0 && txs.every(tx => !tx.ignored);
  });

  async ngOnInit() {
    try {
      const [accs, cats, rules] = await Promise.all([
        this.accountsService.getAll(),
        this.categoriesService.getAll(),
        this.categoryRulesService.getAll(),
      ]);
      this.accounts.set(accs);
      this.categories.set(cats);
      this.categoryRules.set(rules);

      if (accs.length > 0) {
        this.selectedAccountId.set(accs[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas e categorias:', err);
    }
  }

  // ── Eventos de Drag & Drop / Upload ───────────────────────
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

  // ── Processamento do Arquivo ──────────────────────────────
  async processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.ofx')) {
      alert('Por favor, selecione um arquivo no formato .OFX');
      return;
    }

    this.isLoading.set(true);
    this.fileName.set(file.name);
    this.fileSize.set(formatBytes(file.size));

    try {
      const result = await parseAndNormalizeOfx(file);
      const cats = this.categories();

      // Mapeia e tenta auto-categorizar ligando com o banco
      const transactions = result.transactions.map(tx => {
        const matched = this.matchCategoryForTransaction(tx, cats);
        return {
          ...tx,
          categoryId: matched.category?.id ?? null,
          suggestedCategoryId: matched.category?.id ?? null,
          categorySource: matched.source,
          ignored: false
        };
      });

      this.parsedTransactions.set(transactions);
      this.bankName.set(result.institution.bankName);
      this.accountNumber.set(result.account.accountNumber ?? '');
      this.periodStart.set(result.periodStart);
      this.periodEnd.set(result.periodEnd);
      this.statementPeriod.set(result.statementPeriod);
      this.initialBalance.set(result.initialBalance);
      this.finalBalance.set(result.finalBalance);
      this.balanceDate.set(result.balanceDate);
      this.statementTotalCredits.set(result.totalCredits);
      this.statementTotalDebits.set(result.totalDebits);
      this.statementNetAmount.set(result.netAmount);

      // Auto-seleção de conta baseada no nome do banco se possível
      await this.selectOrCreateStatementAccount(result);
      await this.markDuplicatesForSelectedAccount();

    } catch (error) {
      console.error('Erro ao ler arquivo OFX:', error);
      alert('Ocorreu um erro ao processar o arquivo OFX. Verifique se o arquivo está correto.');
      this.resetImport();
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Mutações de Transação ─────────────────────────────────
  async setTransactionCategory(txId: string, categoryId: string | null) {
    const transaction = this.parsedTransactions().find(tx => tx.fitId === txId);
    this.parsedTransactions.update(txs =>
      txs.map(tx => tx.fitId === txId ? { ...tx, categoryId, categorySource: 'manual' } : tx)
    );

    if (transaction && categoryId && categoryId !== transaction.suggestedCategoryId) {
      await this.offerCategoryRuleLearning(transaction, categoryId);
    }
  }

  async selectAccount(accountId: string) {
    this.selectedAccountId.set(accountId);
    await this.markDuplicatesForSelectedAccount();
  }

  toggleIgnore(txId: string) {
    this.parsedTransactions.update(txs =>
      txs.map(tx => tx.fitId === txId ? { ...tx, ignored: !tx.ignored } : tx)
    );
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.parsedTransactions.update(txs =>
      txs.map(tx => ({ ...tx, ignored: !checked }))
    );
  }

  resetImport() {
    this.parsedTransactions.set([]);
    this.fileName.set('');
    this.fileSize.set('');
    this.bankName.set('');
    this.bankCode.set('');
    this.accountNumber.set('');
    this.accountType.set('checking');
    this.accountAutomationMessage.set('');
    this.periodStart.set(null);
    this.periodEnd.set(null);
    this.statementPeriod.set('');
    this.initialBalance.set(null);
    this.finalBalance.set(null);
    this.balanceDate.set(null);
    this.statementTotalCredits.set(0);
    this.statementTotalDebits.set(0);
    this.statementNetAmount.set(0);
  }

  async confirmImport() {
    if (this.totalTransactionsCount() === 0) {
      alert('Nenhuma transação selecionada para importação.');
      return;
    }

    const accountId = this.selectedAccountId();
    if (!accountId) {
      alert('Por favor, selecione uma conta de destino.');
      return;
    }

    this.isLoading.set(true);

    try {
      const selectedTransactions = this.activeTx()
        .filter(tx => !tx.ignored);
      const fitIds = selectedTransactions
        .map(tx => tx.fitId)
        .filter((fitId): fitId is string => Boolean(fitId));
      const existingTransactions = fitIds.length > 0
        ? await this.transactionsService.getAll({
          accountId: { eq: accountId },
          fitId: { in: fitIds },
        })
        : [];
      const existingFitIds = new Set(existingTransactions.map(tx => tx.fitId).filter(Boolean));
      const duplicateCount = selectedTransactions.filter(tx => tx.fitId && existingFitIds.has(tx.fitId)).length;

      const payload = selectedTransactions
        .filter(tx => !tx.fitId || !existingFitIds.has(tx.fitId))
        .map(tx => {
          const dateObj = tx.postedAt ? new Date(tx.postedAt) : new Date();
          const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

          return {
            accountId,
            categoryId: tx.categoryId ?? null,
            description: tx.descriptionNormalized || tx.description,
            originalDescription: tx.description || null,
            amount: tx.amountAbs ?? 0,
            type: tx.direction,
            date: dateStr,
            ignored: false,
            fitId: tx.fitId || null
          };
        });

      if (payload.length > 0) {
        await this.transactionsService.insert(payload);
      }
      await this.persistStatementBalance(accountId);
      this.transactionsService.updated.emit();
      const duplicateMessage = duplicateCount > 0
        ? ` ${duplicateCount} transacao(oes) duplicada(s) foram ignoradas.`
        : '';
      const learningMessage = this.uncategorizedTransactionsCount() > 0
        ? ` ${this.uncategorizedTransactionsCount()} transacao(oes) ficaram sem categoria.`
        : '';
      alert(`Importacao concluida com sucesso!${duplicateMessage}${learningMessage}`);
      this.resetImport();
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      alert('Ocorreu um erro ao salvar as transações importadas no banco.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private matchCategoryForTransaction(
    transaction: ImportedTransaction,
    categories: Category[],
  ): { category: Category | undefined; source: ImportedTransaction['categorySource'] } {
    const description = this.normalizeText(
      `${transaction.descriptionNormalized || ''} ${transaction.description || ''} ${transaction.memo || ''}`,
    );
    const type = transaction.direction === 'credit' ? 'income' : 'expense';
    const rules = this.categoryRules()
      .filter(rule => rule.categoryType === type || !rule.categoryType)
      .sort((a, b) => b.priority - a.priority || b.keyword.length - a.keyword.length);
    const rule = rules.find(candidate => description.includes(this.normalizeText(candidate.keyword)));

    if (rule) {
      return { category: categories.find(category => category.id === rule.categoryId), source: 'rule' };
    }

    const categoryName = autoCategorize(transaction.descriptionNormalized || transaction.description);
    const matchedByName = categories.find(category =>
      category.type === type &&
      this.normalizeText(category.name) === this.normalizeText(categoryName)
    );
    if (matchedByName) return { category: matchedByName, source: 'auto' };

    const fallbackName = type === 'income' ? 'Outras Receitas' : 'Outras Despesas';
    return {
      category: categories.find(category =>
        category.type === type &&
        this.normalizeText(category.name) === this.normalizeText(fallbackName)
      ),
      source: 'fallback',
    };
  }

  private async markDuplicatesForSelectedAccount(): Promise<void> {
    const accountId = this.selectedAccountId();
    const fitIds = this.parsedTransactions()
      .map(tx => tx.fitId)
      .filter((fitId): fitId is string => Boolean(fitId));

    if (!accountId || fitIds.length === 0) return;

    const existingTransactions = await this.transactionsService.getAll({
      accountId: { eq: accountId },
      fitId: { in: fitIds },
    });
    const existingFitIds = new Set(existingTransactions.map(tx => tx.fitId).filter(Boolean));

    this.parsedTransactions.update(txs =>
      txs.map(tx => {
        const duplicate = Boolean(tx.fitId && existingFitIds.has(tx.fitId));

        return {
          ...tx,
          duplicate,
          ignored: duplicate ? true : tx.ignored,
        };
      })
    );
  }

  private async offerCategoryRuleLearning(
    transaction: ImportedTransaction,
    categoryId: string,
  ): Promise<void> {
    const keyword = this.buildRuleKeyword(transaction);
    if (!keyword || this.categoryRules().some(rule =>
      this.normalizeText(rule.keyword) === this.normalizeText(keyword)
    )) {
      return;
    }

    const category = this.categories().find(item => item.id === categoryId);
    const shouldLearn = confirm(
      `Criar uma regra para categorizar descricoes parecidas com "${keyword}" como "${category?.name ?? 'categoria selecionada'}"?`,
    );
    if (!shouldLearn) return;

    try {
      const created = await this.categoryRulesService.insert({
        keyword,
        categoryId,
        priority: 50,
        createdByUser: true,
      });
      this.categoryRules.update(rules => [...rules, created]);
      this.categoryRulesService.updated.emit();
    } catch (error) {
      console.warn('Nao foi possivel criar a regra automaticamente:', error);
    }
  }

  private buildRuleKeyword(transaction: ImportedTransaction): string {
    const source = (transaction.descriptionNormalized || transaction.description || transaction.memo || '')
      .replace(/\s+/g, ' ')
      .trim();

    return source.length > 36 ? source.slice(0, 36).trim() : source;
  }

  private async selectOrCreateStatementAccount(result: OfxParseResult): Promise<void> {
    const accountType = this.mapOfxAccountType(result.account.accountType);
    const bankCode = this.bankService.resolveBankCode(
      result.account.bankId ?? result.institution.bankId,
      result.institution.bankName,
    );
    const accountNumber = this.normalizeAccountNumber(result.account.accountNumber);

    this.accountType.set(accountType);
    this.bankCode.set(bankCode);
    this.accountNumber.set(result.account.accountNumber ?? '');

    const existing = this.findStatementAccount(accountType, bankCode, accountNumber, result.institution.bankName);
    if (existing) {
      this.selectedAccountId.set(existing.id);
      this.accountAutomationMessage.set(`Conta selecionada automaticamente: ${existing.name}`);
      return;
    }

    const bank = bankCode ? this.bankService.getBankByCode(bankCode) : undefined;
    const bankName = bank?.name || result.institution.bankName || 'Banco Importado';
    const created = await this.accountsService.insert({
      name: this.buildAccountName(bankName, accountType, accountNumber),
      type: accountType,
      bankCode,
      accountNumber,
      balance: result.finalBalance ?? 0,
      color: this.accountColor(accountType),
      icon: this.accountIcon(accountType),
    });

    this.accounts.update(accounts => [...accounts, created]);
    this.selectedAccountId.set(created.id);
    this.accountAutomationMessage.set(`Conta criada automaticamente: ${created.name}`);
    this.accountsService.updated.emit();
  }

  private findStatementAccount(
    accountType: AccountType,
    bankCode: string,
    accountNumber: string,
    bankName: string,
  ): Account | undefined {
    const normalizedBankName = this.normalizeText(bankName);
    const candidates = this.accounts().filter(account => {
      const sameType = account.type === accountType;
      const sameBank = bankCode
        ? account.bankCode === bankCode
        : this.normalizeText(account.name).includes(normalizedBankName);

      return sameType && sameBank;
    });

    if (accountNumber) {
      const byNumber = candidates.find(account =>
        this.normalizeAccountNumber(account.accountNumber) === accountNumber
      );
      if (byNumber) return byNumber;
    }

    return candidates.find(account => !account.accountNumber) ?? candidates[0];
  }

  private mapOfxAccountType(accountType: string | null): AccountType {
    const normalized = this.normalizeText(accountType);

    if (/sav|poup/.test(normalized)) return 'savings';
    if (/money|invest|broker|corret/.test(normalized)) return 'investment';

    return 'checking';
  }

  private buildAccountName(bankName: string, accountType: AccountType, accountNumber: string): string {
    const suffix = accountNumber ? ` ${accountNumber}` : '';
    return `${bankName} - ${this.accountTypeLabel(accountType)}${suffix}`;
  }

  private accountTypeLabel(accountType: AccountType): string {
    const labels: Record<AccountType, string> = {
      checking: 'Conta Corrente',
      savings: 'Poupanca',
      cash: 'Dinheiro',
      investment: 'Investimentos',
    };

    return labels[accountType];
  }

  private accountIcon(accountType: AccountType): string {
    const icons: Record<AccountType, string> = {
      checking: 'account_balance',
      savings: 'savings',
      cash: 'payments',
      investment: 'account_balance_wallet',
    };

    return icons[accountType];
  }

  private accountColor(accountType: AccountType): string {
    const colors: Record<AccountType, string> = {
      checking: '#2563eb',
      savings: '#16a34a',
      cash: '#f59e0b',
      investment: '#7c3aed',
    };

    return colors[accountType];
  }

  private normalizeAccountNumber(value?: string | null): string {
    return (value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private normalizeText(value?: string | null): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private async persistStatementBalance(accountId: string): Promise<void> {
    const finalBalance = this.finalBalance();
    if (finalBalance === null) return;

    await this.statementBalancesService.upsert({
      accountId,
      period: this.statementPeriod() || this.periodFromDate(this.periodEnd()) || new Date().toISOString().slice(0, 7),
      statementStartDate: this.toIsoDate(this.periodStart()),
      statementEndDate: this.toIsoDate(this.periodEnd()),
      initialBalance: this.initialBalance(),
      finalBalance,
      totalCredits: this.statementTotalCredits(),
      totalDebits: this.statementTotalDebits(),
      netAmount: this.statementNetAmount(),
      transactionCount: this.parsedTransactions().length,
      bankName: this.bankName() || null,
      accountNumber: this.accountNumber() || null,
      fileName: this.fileName() || null,
      importedAt: new Date().toISOString(),
    });

    await this.accountsService.update(accountId, { balance: finalBalance });
    this.statementBalancesService.updated.emit();
    this.accountsService.updated.emit();
  }

  private toIsoDate(date: Date | null): string | null {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private periodFromDate(date: Date | null): string | null {
    return this.toIsoDate(date)?.slice(0, 7) ?? null;
  }
}
