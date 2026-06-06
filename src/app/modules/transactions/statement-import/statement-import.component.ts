import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableColumn, DataTableComponent } from '../../../components/data-table/data-table.component';
import { formatBytes, parseAndNormalizeOfx } from '../../../utils/helpers/ofx-parser.helper';
import {
  suggestCategoryRuleKeywords,
  transactionMatchesKeyword,
} from '../../../utils/helpers/category-rule.helper';
import { Account, AccountType, Category, CategoryRule, ImportedTransaction } from '../../../models';
import { OfxParseResult } from '../../../models/ofx.model';
import { AccountsService } from '../../../services/accounts.service';
import { AccountStatementBalancesService } from '../../../services/account-statement-balances.service';
import { AiCategorizationService } from '../../../services/ai-categorization.service';
import { BankService } from '../../../services/banks.service';
import { CategoryRulesService } from '../../../services/category-rules.service';
import { CategoriesService } from '../../../services/categories.service';
import { DialogService } from '../../../services/dialog.service';
import { TransactionsService } from '../../../services/transactions.service';
import {
  accountColor,
  accountIcon,
  applyAiCategorizationSuggestions,
  buildAiCategorizationRequest,
  buildAccountName,
  buildImportPayload,
  duplicateCountForTransactions,
  findStatementAccount,
  mapOfxAccountType,
  markDuplicateTransactions,
  matchCategoryForTransaction,
  normalizeAccountNumber,
  normalizeText,
  periodFromDate,
  selectedImportTransactions,
  toIsoDate,
  transactionFitIds,
  transactionFitIdSet,
} from './statement-import.utils';

@Component({
  selector: 'app-statement-import',
  imports: [CommonModule, FormsModule, DataTableComponent, DatePipe],
  templateUrl: './statement-import.component.html',
  styleUrl: './statement-import.component.css',
})
export class StatementImportComponent implements OnInit {
  private readonly accountsService = inject(AccountsService);
  private readonly statementBalancesService = inject(AccountStatementBalancesService);
  private readonly aiCategorizationService = inject(AiCategorizationService);
  private readonly bankService = inject(BankService);
  private readonly categoryRulesService = inject(CategoryRulesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly dialogService = inject(DialogService);
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
  readonly isAiCategorizing = signal(false);
  readonly fileName = signal('');
  readonly fileSize = signal('');
  readonly bankName = signal('');
  readonly bankCode = signal('');
  readonly accountNumber = signal('');
  readonly accountType = signal<AccountType>('checking');
  readonly accountAutomationMessage = signal('');
  readonly aiCategorizationMessage = signal('');
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
      await this.dialogService.alert({
        title: 'Arquivo invalido',
        message: 'Por favor, selecione um arquivo no formato .OFX.',
        variant: 'warning',
      });
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
        const matched = matchCategoryForTransaction(tx, cats, this.categoryRules());
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
      await this.dialogService.alert({
        title: 'Erro ao processar OFX',
        message: 'Ocorreu um erro ao processar o arquivo OFX. Verifique se o arquivo esta correto.',
        variant: 'danger',
      });
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

  async categorizeWithAi(): Promise<void> {
    const transactions = this.activeTx().filter(tx => !tx.ignored);

    if (transactions.length === 0) {
      await this.dialogService.alert({
        title: 'Nada para categorizar',
        message: 'Nenhuma transacao selecionada para a IA analisar.',
        variant: 'warning',
      });
      return;
    }

    this.isAiCategorizing.set(true);
    this.aiCategorizationMessage.set('');

    try {
      const result = await this.aiCategorizationService.categorize(
        buildAiCategorizationRequest(this.categories(), transactions),
      );
      const categorized = applyAiCategorizationSuggestions(
        this.parsedTransactions(),
        result.items,
        this.categories(),
      );

      this.parsedTransactions.set(categorized.transactions);

      this.aiCategorizationMessage.set(
        `${categorized.applied} transacao(oes) categorizada(s) por ${result.provider === 'openai' ? 'OpenAI' : 'Gemini'}.`,
      );
    } catch (error) {
      console.error('Erro na categorizacao por IA:', error);
      await this.dialogService.alert({
        title: 'Categorizacao por IA',
        message: error instanceof Error
          ? error.message
          : 'Nao foi possivel categorizar as transacoes com IA.',
        variant: 'warning',
      });
    } finally {
      this.isAiCategorizing.set(false);
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
    this.aiCategorizationMessage.set('');
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
      await this.dialogService.alert({
        title: 'Nada para importar',
        message: 'Nenhuma transacao selecionada para importacao.',
        variant: 'warning',
      });
      return;
    }

    const accountId = this.selectedAccountId();
    if (!accountId) {
      await this.dialogService.alert({
        title: 'Conta obrigatoria',
        message: 'Por favor, selecione uma conta de destino.',
        variant: 'warning',
      });
      return;
    }

    this.isLoading.set(true);

    try {
      const selectedTransactions = selectedImportTransactions(this.activeTx());
      const fitIds = transactionFitIds(selectedTransactions);
      const existingTransactions = fitIds.length > 0
        ? await this.transactionsService.getAll({
          accountId: { eq: accountId },
          fitId: { in: fitIds },
        })
        : [];
      const existingFitIds = transactionFitIdSet(existingTransactions);
      const duplicateCount = duplicateCountForTransactions(selectedTransactions, existingFitIds);
      const payload = buildImportPayload(selectedTransactions, accountId, existingFitIds);

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
      await this.dialogService.alert({
        title: 'Importacao concluida',
        message: `Importacao concluida com sucesso!${duplicateMessage}${learningMessage}`,
        variant: 'success',
      });
      this.resetImport();
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      await this.dialogService.alert({
        title: 'Erro ao salvar',
        message: 'Ocorreu um erro ao salvar as transacoes importadas no banco.',
        variant: 'danger',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  private async markDuplicatesForSelectedAccount(): Promise<void> {
    const accountId = this.selectedAccountId();
    const fitIds = transactionFitIds(this.parsedTransactions());

    if (!accountId || fitIds.length === 0) return;

    const existingTransactions = await this.transactionsService.getAll({
      accountId: { eq: accountId },
      fitId: { in: fitIds },
    });
    const existingFitIds = transactionFitIdSet(existingTransactions);

    this.parsedTransactions.update(txs => markDuplicateTransactions(txs, existingFitIds));
  }

  private async offerCategoryRuleLearning(
    transaction: ImportedTransaction,
    categoryId: string,
  ): Promise<void> {
    const existingKeywords = new Set(this.categoryRules().map(rule => normalizeText(rule.keyword)));
    const keywords = suggestCategoryRuleKeywords(transaction)
      .filter(keyword => !existingKeywords.has(normalizeText(keyword)));

    if (keywords.length === 0) {
      return;
    }

    const category = this.categories().find(item => item.id === categoryId);
    const shouldLearn = await this.dialogService.confirm({
      title: 'Aprender categorizacao',
      message: `Sempre categorizar transacoes parecidas com "${keywords.join('" ou "')}" como "${category?.name ?? 'categoria selecionada'}"?`,
      confirmLabel: 'Criar regra',
      variant: 'info',
    });
    if (!shouldLearn) return;

    try {
      const createdRules: CategoryRule[] = [];

      for (const keyword of keywords) {
        const created = await this.categoryRulesService.insert({
          keyword,
          categoryId,
          priority: 70,
          createdByUser: true,
        });
        createdRules.push(created);
      }

      if (createdRules.length === 0) return;

      this.categoryRules.update(rules => [...rules, ...createdRules]);
      this.applyLearnedRules(createdRules, categoryId);
      this.categoryRulesService.updated.emit();
    } catch (error) {
      console.warn('Nao foi possivel criar a regra automaticamente:', error);
    }
  }

  private applyLearnedRules(rules: CategoryRule[], categoryId: string): void {
    this.parsedTransactions.update(txs =>
      txs.map(tx => {
        const matches = rules.some(rule => transactionMatchesKeyword(tx, rule.keyword));

        if (!matches || tx.categorySource === 'manual') return tx;

        return {
          ...tx,
          categoryId,
          suggestedCategoryId: categoryId,
          categorySource: 'rule',
        };
      })
    );
  }

  private async selectOrCreateStatementAccount(result: OfxParseResult): Promise<void> {
    const accountType = mapOfxAccountType(result.account.accountType);
    const bankCode = this.bankService.resolveBankCode(
      result.account.bankId ?? result.institution.bankId,
      result.institution.bankName,
    );
    const accountNumber = normalizeAccountNumber(result.account.accountNumber);

    this.accountType.set(accountType);
    this.bankCode.set(bankCode);
    this.accountNumber.set(result.account.accountNumber ?? '');

    const existing = findStatementAccount(
      this.accounts(),
      accountType,
      bankCode,
      accountNumber,
      result.institution.bankName,
    );
    if (existing) {
      this.selectedAccountId.set(existing.id);
      this.accountAutomationMessage.set(`Conta selecionada automaticamente: ${existing.name}`);
      return;
    }

    const bank = bankCode ? this.bankService.getBankByCode(bankCode) : undefined;
    const bankName = bank?.name || result.institution.bankName || 'Banco Importado';
    const created = await this.accountsService.insert({
      name: buildAccountName(bankName, accountType, accountNumber),
      type: accountType,
      bankCode,
      accountNumber,
      balance: result.finalBalance ?? 0,
      color: accountColor(accountType),
      icon: accountIcon(accountType),
    });

    this.accounts.update(accounts => [...accounts, created]);
    this.selectedAccountId.set(created.id);
    this.accountAutomationMessage.set(`Conta criada automaticamente: ${created.name}`);
    this.accountsService.updated.emit();
  }

  private async persistStatementBalance(accountId: string): Promise<void> {
    const finalBalance = this.finalBalance();
    if (finalBalance === null) return;

    await this.statementBalancesService.upsert({
      accountId,
      period: this.statementPeriod() || periodFromDate(this.periodEnd()) || new Date().toISOString().slice(0, 7),
      statementStartDate: toIsoDate(this.periodStart()),
      statementEndDate: toIsoDate(this.periodEnd()),
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

}
