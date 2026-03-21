import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Account, Movement, Category, Keyword } from '../../services/database.service';
import { LucideAngularModule, FileUp, CheckCircle, AlertCircle, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-angular';
import { Ofx } from 'ofx-data-extractor';
import { DeepSearch } from '../../utils/object.utils';

interface ParsedMovement {
  date: string;
  description: string;
  amount: number;
  type: 'C' | 'D';
  period: string; // YYYY-MM
  category_id?: number | null;

  classification_source?: 'manual' | 'keyword' | 'imported';
  classification_rule_id?: number | null;
  confidence?: number | null;
}

interface ParsedStatement {
  fileName: string;
  period: string;
  movements: ParsedMovement[];
  total: number;
  credit: number;
  debit: number;
  initialBalance: number | null;
  finalBalance: number | null;
  isComplete: boolean;
}

@Component({
  selector: 'app-import-statement',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './import-statement.component.html',
  styleUrl: './import-statement.component.css'
})
export class ImportStatementComponent implements OnInit {
  accounts = signal<Account[]>([]);
  selectedAccountId = signal<number | null>(null);
  selectedPeriod = signal(new Date().toISOString().slice(0, 7)); // YYYY-MM

  parsedStatements = signal<ParsedStatement[]>([]);
  readonly allMovements = computed(() =>
    this.parsedStatements().flatMap((s, sIdx) =>
      s.movements.map((m, mIdx) => ({ ...m, sIdx, mIdx }))
    ).sort((a, b) => a.date.localeCompare(b.date))
  );

  isParsing = signal(false);
  importStatus = signal<'idle' | 'success' | 'error'>('idle');
  errorMessage = signal('');

  readonly FileUpIcon = FileUp;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertCircleIcon = AlertCircle;
  readonly TrashIcon = Trash2;
  readonly UpIcon = ArrowUpCircle;
  readonly DownIcon = ArrowDownCircle;

  keywords = signal<Keyword[]>([]);
  keywordRules = signal<any[]>([]);
  categories = signal<Category[]>([]);

  constructor(private db: DatabaseService) { }

  async ngOnInit() {
    const [accs, cats, keys, rules] = await Promise.all([
      this.db.getAccounts(),
      this.db.getCategories(),
      this.db.getKeywords(),
      this.db.getKeywordRules()
    ]);
    this.accounts.set(accs);
    this.categories.set(cats);
    this.keywords.set(keys);
    this.keywordRules.set(rules);

    if (accs.length > 0) {
      this.selectedAccountId.set(accs[0].id!);
    }
  }

  async onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    this.isParsing.set(true);
    this.importStatus.set('idle');
    this.errorMessage.set('');

    const statements: ParsedStatement[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();

      try {
        if (file.name.toLowerCase().endsWith('.ofx')) {
          const statement = await this.processOFX(file.name, content);
          statements.push(statement);
        } else {
          const statement = this.processCSV(file.name, content);
          statements.push(statement);
        }
      } catch (err: any) {
        console.error(err);
        this.errorMessage.set(`Erro no arquivo ${file.name}: ${err.message}`);
      }
    }

    this.parsedStatements.set(statements);
    this.isParsing.set(false);
  }

  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // OFX format: YYYYMMDD...
    if (/^\d{8}/.test(dateStr)) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }

    // DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.slice(0, 10);
    }

    return dateStr;
  }

  private processCSV(fileName: string, content: string): ParsedStatement {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados.');

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim());

    const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('hist'));
    const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('val'));

    if (dateIdx === -1 || descIdx === -1 || valIdx === -1) {
      throw new Error('Não foi possível identificar as colunas (Data, Descrição, Valor).');
    }

    const movements: ParsedMovement[] = [];
    let credit = 0;
    let debit = 0;
    let total = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      if (cols.length <= Math.max(dateIdx, descIdx, valIdx)) continue;

      const dateStr = cols[dateIdx];
      const desc = cols[descIdx];
      let amountStr = cols[valIdx].replace(/[R$\s]/g, '').replace(',', '.');

      const amount = parseFloat(amountStr);
      if (isNaN(amount)) continue;

      const formattedDate = this.normalizeDate(dateStr);
      const period = formattedDate.slice(0, 7);
      const autoCat = this.autoCategorize(desc);

      const absAmount = Math.abs(amount);
      if (amount < 0) {
        debit += absAmount;
      } else {
        credit += absAmount;
      }
      total += amount;

      movements.push({
        date: formattedDate,
        description: desc,
        amount: absAmount,
        type: amount < 0 ? 'D' : 'C',
        period,
        category_id: autoCat.categoryId,
        classification_source: autoCat.source as any,
        classification_rule_id: autoCat.ruleId,
        confidence: autoCat.confidence
      });
    }

    const detectedPeriod = this.getMostFrequentPeriod(movements);

    return {
      fileName,
      period: detectedPeriod,
      movements,
      total,
      credit,
      debit,
      initialBalance: null,
      finalBalance: null,
      isComplete: false
    };
  }

  private getMostFrequentPeriod(movements: ParsedMovement[]): string {
    if (movements.length === 0) return this.selectedPeriod();
    const counts: { [key: string]: number } = {};
    movements.forEach(m => {
      const p = m.period;
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  private autoCategorize(description: string): {
    categoryId: number | null,
    source: string | null,
    ruleId: number | null,
    confidence: number | null
  } {
    const desc = description.toUpperCase();

    // Check Keyword Rules (Priority)
    const ruleMatch = this.keywordRules().find(r => desc.includes(r.keyword.toUpperCase()));
    if (ruleMatch) {
      return {
        categoryId: ruleMatch.category_id,
        source: 'keyword',
        ruleId: ruleMatch.id,
        confidence: 0.9
      };
    }

    // Fallback to legacy keywords
    const match = this.keywords().find(k => desc.includes(k.keyword.toUpperCase()));
    return {
      categoryId: match ? match.category_id : null,
      source: match ? 'keyword' : 'imported',
      ruleId: null,
      confidence: match ? 0.7 : 0.4
    };
  }

  private async processOFX(fileName: string, content: string): Promise<ParsedStatement> {
    const ofxData = new Ofx(content).toJson();
    const bankName = DeepSearch(ofxData, 'ORG');

    if (bankName) {
      let account = this.accounts().find(a => a.name.includes(bankName) || a.name === bankName);
      if (!account) {
        if (confirm(`O banco '${bankName}' não foi encontrado. Deseja criar uma nova conta automaticamente?`)) {
          const res = await this.db.addAccount({ name: bankName, balance: 0 });
          const newAccs = await this.db.getAccounts();
          this.accounts.set(newAccs);
          account = newAccs.find(a => a.id === res.id);
        }
      }
      if (account) {
        this.selectedAccountId.set(account.id!);
      }
    }

    const ofxMovements = DeepSearch(ofxData, 'STRTTRN') || [];
    let credit = 0;
    let debit = 0;
    let total = 0;

    const movements: ParsedMovement[] = ofxMovements.map((m: any) => {
      const amount = Number(m.TRNAMT);
      const absAmount = Math.abs(amount);
      
      total = (total || 0) + amount;
      if (m.TRNTYPE === 'CREDIT' || amount > 0) {
        credit = (credit || 0) + absAmount;
      } else {
        debit = (debit || 0) + absAmount;
      }

      const autoCat = this.autoCategorize(m.MEMO);
      const normalizedDate = this.normalizeDate(m.DTPOSTED);

      return {
        date: normalizedDate,
        description: m.MEMO,
        amount: absAmount,
        type: (m.TRNTYPE === 'CREDIT' || amount > 0) ? 'C' : 'D',
        period: normalizedDate.slice(0, 7),
        category_id: autoCat.categoryId,
        classification_source: autoCat.source as any,
        classification_rule_id: autoCat.ruleId,
        confidence: autoCat.confidence
      };
    });

    const finalBalance = Number(DeepSearch(ofxData, 'BALAMT'));
    const initialBalance = !isNaN(finalBalance) ? finalBalance - total : null;
    const period = this.getMostFrequentPeriod(movements);
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const isComplete = !isNaN(finalBalance) && period < currentMonth;

    return {
      fileName,
      period,
      movements,
      total,
      credit,
      debit,
      initialBalance: isNaN(initialBalance!) ? null : initialBalance,
      finalBalance: isNaN(finalBalance) ? null : finalBalance,
      isComplete
    };
  }

  removeMovement(statementIndex: number, movementIndex: number) {
    const statements = [...this.parsedStatements()];
    const statement = { ...statements[statementIndex] };
    const movements = [...statement.movements];
    
    movements.splice(movementIndex, 1);
    statement.movements = movements;
    
    // Recalculate totals for this statement
    let credit = 0;
    let debit = 0;
    let total = 0;
    for (const m of movements) {
      const amount = m.amount;
      total += (m.type === 'C' ? amount : -amount);
      if (m.type === 'C') credit += amount;
      else debit += amount;
    }
    statement.total = total;
    statement.credit = credit;
    statement.debit = debit;
    if (statement.finalBalance !== null) {
      statement.initialBalance = statement.finalBalance - total;
    }

    statements[statementIndex] = statement;
    this.parsedStatements.set(statements);
  }

  private isAllowedToCreateAC(period: string, source: 'import' | 'manual'): boolean {
    const currentMonth = new Date().toISOString().slice(0, 7);

    if (source === 'import') return true;

    if (source === 'manual') {
      return period === currentMonth;
    }

    return false;
  }

  async importData() {
    const accId = this.selectedAccountId();
    if (!accId) {
      this.errorMessage.set('Selecione uma conta.');
      return;
    }

    if (this.allMovements().length === 0) {
      this.errorMessage.set('Nenhum dado para importar.');
      return;
    }

    const account = this.accounts().find(a => a.id == accId);
    const accountName = account ? account.name : 'conta selecionada';

    if (!confirm(`Deseja importar ${this.allMovements().length} movimentações para a conta "${accountName}"?`)) {
      return;
    }

    try {
      for (const statement of this.parsedStatements()) {
        if (statement.initialBalance !== null && this.isAllowedToCreateAC(statement.period, 'import')) {
          await this.db.addMovement({
            account_id: accId,
            description: 'Abertura de Conta (Importado)',
            amount: statement.initialBalance,
            period: statement.period,
            date: `${statement.period}-01`,
            type: 'AC'
          }, true);
        }

        await Promise.all(statement.movements.map(m => 
          this.db.addMovement({
            account_id: accId,
            description: m.description,
            amount: m.amount,
            period: statement.period,
            date: m.date,
            type: m.type,
            category_id: m.category_id,
            classification_source: m.classification_source,
            classification_rule_id: m.classification_rule_id,
            confidence: m.confidence
          }, true)
        ));

        // Recalculate account definitive balance once after all batch inserts
        await this.db.recalculateBalance(accId);

        // 4. Conditional closing (Suggestion)
        if (statement.isComplete) {
          if (confirm(`O período ${statement.period} parece completo. Deseja fechá-lo agora?`)) {
            await this.db.closePeriod(accId, statement.period);
          }
        }
      }

      this.importStatus.set('success');
      this.parsedStatements.set([]);
    } catch (err) {
      console.error(err);
      this.errorMessage.set('Erro ao salvar no banco de dados.');
      this.importStatus.set('error');
    }
  }
}
