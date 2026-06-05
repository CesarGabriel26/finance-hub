import { EventEmitter, Injectable } from '@angular/core';
import type { Transaction, NewTransaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.TransactionsApi!;
  }

  /**
   * Lista todas as transações de uma conta, ordenadas por data decrescente.
   */
  getAll(query?: string | Record<string, unknown>): Promise<Transaction[]> {
    return this.api.getAll(query);
  }

  /** Retorna uma transação pelo ID ou null */
  getById(id: string): Promise<Transaction | null> {
    return this.api.getById(id);
  }

  /**
   * Insere uma ou várias transações.
   * Aceita objeto único ou array (ideal para importação OFX em lote).
   */
  insert(data: NewTransaction | NewTransaction[]): Promise<Transaction[]> {
    return this.api.insert(data);
  }

  /** Atualiza campos de uma transação existente */
  update(id: string, data: Partial<NewTransaction>): Promise<Transaction | null> {
    return this.api.update(id, data);
  }

  /** Remove uma transação pelo ID */
  delete(id: string): Promise<Transaction | null> {
    return this.api.delete(id);
  }
}
