import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Account, Movement, Category, Keyword } from '../../services/database.service';
import { LucideAngularModule, FileUp, CheckCircle, AlertCircle, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-angular';

interface ParsedMovement {
  date: string;
  description: string;
  amount: number;
  type: 'C' | 'D';
  category_id?: number | null;

  classification_source?: 'manual' | 'keyword' | 'imported';
  classification_rule_id?: number | null;
  confidence?: number | null;
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
  
  parsedMovements = signal<ParsedMovement[]>([]);
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

  constructor(private db: DatabaseService) {}

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isParsing.set(true);
    this.importStatus.set('idle');
    this.errorMessage.set('');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      try {
        if (file.name.toLowerCase().endsWith('.ofx')) {
          this.parseOFX(content);
        } else {
          this.parseCSV(content);
        }
      } catch (err) {
        console.error(err);
        this.errorMessage.set('Erro ao processar o arquivo. Verifique o formato.');
        this.importStatus.set('error');
      } finally {
        this.isParsing.set(false);
      }
    };
    reader.readAsText(file);
  }

  private parseCSV(content: string) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados.');

    // Try to detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim());
    
    // Find column indexes
    const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('memo') || h.includes('hist'));
    const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('val'));

    if (dateIdx === -1 || descIdx === -1 || valIdx === -1) {
      throw new Error('Não foi possível identificar as colunas (Data, Descrição, Valor).');
    }

    const movements: ParsedMovement[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      if (cols.length <= Math.max(dateIdx, descIdx, valIdx)) continue;

      const dateStr = cols[dateIdx];
      const desc = cols[descIdx];
      let amountStr = cols[valIdx].replace(/[R$\s]/g, '').replace(',', '.');
      
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) continue;

      const autoCat = this.autoCategorize(desc);
      
      movements.push({
        date: this.formatDate(dateStr),
        description: desc,
        amount: Math.abs(amount),
        type: amount < 0 ? 'D' : 'C',
        category_id: autoCat.categoryId,
        classification_source: autoCat.source as any,
        classification_rule_id: autoCat.ruleId,
        confidence: autoCat.confidence
      });
    }

    this.parsedMovements.set(movements);
    this.detectPeriod(movements);
  }

  private detectPeriod(movements: ParsedMovement[]) {
    if (movements.length === 0) return;

    const counts: { [key: string]: number } = {};
    movements.forEach(m => {
      const period = m.date.slice(0, 7); // YYYY-MM
      counts[period] = (counts[period] || 0) + 1;
    });

    let maxCount = 0;
    let bestPeriod = this.selectedPeriod();

    for (const period in counts) {
      if (counts[period] > maxCount) {
        maxCount = counts[period];
        bestPeriod = period;
      }
    }

    this.selectedPeriod.set(bestPeriod);
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

  private parseOFX(content: string) {
    const movements: ParsedMovement[] = [];
    
    // Simple regex parser for OFX
    const transactions = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g);
    
    if (!transactions) throw new Error('Nenhuma transação encontrada no arquivo OFX.');

    transactions.forEach(trx => {
      const dateMatch = trx.match(/<DTPOSTED>(\d{8})/);
      const amountMatch = trx.match(/<TRNAMT>([\d.-]+)/);
      const memoMatch = trx.match(/<MEMO>([^<]+)/) || trx.match(/<NAME>([^<]+)/);

      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1]; // YYYYMMDD
        const amount = parseFloat(amountMatch[1]);
        const description = memoMatch ? memoMatch[1].trim() : 'Sem descrição';

        const autoCat = this.autoCategorize(description);

        movements.push({
          date: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
          description,
          amount: Math.abs(amount),
          type: amount < 0 ? 'D' : 'C',
          category_id: autoCat.categoryId,
          classification_source: autoCat.source as any,
          classification_rule_id: autoCat.ruleId,
          confidence: autoCat.confidence
        });
      }
    });

    this.parsedMovements.set(movements);
    this.detectPeriod(movements);
  }

  private formatDate(dateStr: string): string {
    // Try to parse DD/MM/YYYY or YYYY-MM-DD
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        return `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr; // Fallback
  }

  removeMovement(index: number) {
    const current = [...this.parsedMovements()];
    current.splice(index, 1);
    this.parsedMovements.set(current);
  }

  async importData() {
    const accId = this.selectedAccountId();
    if (!accId) {
      this.errorMessage.set('Selecione uma conta.');
      return;
    }

    if (this.parsedMovements().length === 0) {
      this.errorMessage.set('Nenhum dado para importar.');
      return;
    }

    try {
      for (const m of this.parsedMovements()) {
        await this.db.addMovement({
          account_id: accId,
          description: m.description,
          amount: m.amount, // amount should be positive in the signal, addMovement handles it
          period: this.selectedPeriod(),
          date: m.date,
          type: m.type,
          category_id: m.category_id,
          classification_source: m.classification_source,
          classification_rule_id: m.classification_rule_id,
          confidence: m.confidence
        });
      }
      this.importStatus.set('success');
      this.parsedMovements.set([]);
    } catch (err) {
      console.error(err);
      this.errorMessage.set('Erro ao salvar no banco de dados.');
      this.importStatus.set('error');
    }
  }

  get totalImport() {
    return this.parsedMovements().reduce((acc, m) => acc + (m.type === 'C' ? m.amount : -m.amount), 0);
  }
}
