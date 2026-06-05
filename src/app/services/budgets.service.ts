import { EventEmitter, Injectable } from '@angular/core';
import type { Budget, NewBudget } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetsService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.BudgetsApi!;
  }

  /**
   * Lista os orçamentos de um mês e ano específicos.
   * @param month - Número do mês (1–12)
   * @param year  - Ano (ex: 2025)
   */
  getAll(month: number, year: number): Promise<Budget[]> {
    return this.api.getAll(month, year);
  }

  /** Retorna um orçamento pelo ID ou null */
  getById(id: string): Promise<Budget | null> {
    return this.api.getById(id);
  }

  /** Cria um teto de orçamento para uma categoria no período */
  insert(data: NewBudget): Promise<Budget> {
    return this.api.insert(data);
  }

  /** Atualiza campos de um orçamento existente */
  update(id: string, data: Partial<NewBudget>): Promise<Budget | null> {
    return this.api.update(id, data);
  }

  /** Remove um orçamento pelo ID */
  delete(id: string): Promise<Budget | null> {
    return this.api.delete(id);
  }
}
