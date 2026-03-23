import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Movement } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private db = inject(DatabaseService);

  async getMovements(accountId: number, period: string): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getMovements', accountId, period);
  }

  async getMovementsForReview(): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getMovementsForReview');
  }

  async addMovement(movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    return this.db.handleApi('addMovement', movement, skipRecalculation);
  }

  async updateMovement(id: number, movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    return this.db.handleApi('updateMovement', id, movement, skipRecalculation);
  }

  async deleteMovement(id: number, skipRecalculation?: boolean): Promise<any> {
    return this.db.handleApi('deleteMovement', id, skipRecalculation);
  }

  async closePeriod(accountId: number, period: string): Promise<any> {
    return this.db.handleApi('closePeriod', accountId, period);
  }

  async recategorizeMovements(): Promise<{ updatedCount: number }> {
    return this.db.handleApi<{ updatedCount: number }>('recategorizeMovements');
  }
}
