import { Injectable, signal } from '@angular/core';
import { ParsedStatement, Account } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  parsedStatements = signal<ParsedStatement[]>([]);
  selectedAccountId = signal<number | null>(null);

  setStatements(statements: ParsedStatement[]) {
    this.parsedStatements.set(statements);
  }

  clearStatements() {
    this.parsedStatements.set([]);
  }

  removeMovement(sIdx: number, mIdx: number) {
    const current = [...this.parsedStatements()];
    if (!current[sIdx]) return;

    const statement = { ...current[sIdx] };
    const movements = [...statement.movements];
    movements.splice(mIdx, 1);
    statement.movements = movements;

    // Recalculate totals
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

    current[sIdx] = statement;
    this.parsedStatements.set(current);
  }
}
