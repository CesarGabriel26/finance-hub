import { EventEmitter, Injectable } from '@angular/core';
import type { SavingGoal, NewSavingGoal } from '../models/saving-goal.model';

@Injectable({ providedIn: 'root' })
export class SavingGoalsService {
  public updated = new EventEmitter<void>();

  private get api() {
    return window.SavingGoalsApi!;
  }

  /** Lista todas as metas de poupança */
  getAll(): Promise<SavingGoal[]> {
    return this.api.getAll();
  }

  /** Retorna uma meta pelo ID ou null */
  getById(id: string): Promise<SavingGoal | null> {
    return this.api.getById(id);
  }

  /** Cria uma nova meta de poupança */
  insert(data: NewSavingGoal): Promise<SavingGoal> {
    return this.api.insert(data);
  }

  /**
   * Atualiza campos de uma meta existente.
   * Use para incrementar `currentAmount` após um depósito ou alterar `status`.
   */
  update(id: string, data: Partial<NewSavingGoal>): Promise<SavingGoal | null> {
    return this.api.update(id, data);
  }

  /** Remove uma meta pelo ID */
  delete(id: string): Promise<SavingGoal | null> {
    return this.api.delete(id);
  }
}
