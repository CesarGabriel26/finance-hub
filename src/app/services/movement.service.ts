import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Movement } from '../models/database.models';
import { DataNotificationService } from './data-notification.service';

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private db = inject(DatabaseService);
  private dataNotification = inject(DataNotificationService);

  async getMovements(accountId: number, period: string): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getMovements', accountId, period);
  }

  async getMovementsForReview(): Promise<Movement[]> {
    return this.db.handleApi<Movement[]>('getMovementsForReview');
  }

  async addMovement(movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    const res = await this.db.handleApi('addMovement', movement, skipRecalculation);
    this.dataNotification.notifyDataChange();
    return res;
  }

  async updateMovement(id: number, movement: Partial<Movement>, skipRecalculation?: boolean): Promise<any> {
    const res = await this.db.handleApi('updateMovement', id, movement, skipRecalculation);
    this.dataNotification.notifyDataChange();
    return res;
  }

  async deleteMovement(id: number, skipRecalculation?: boolean): Promise<any> {
    const res = await this.db.handleApi('deleteMovement', id, skipRecalculation);
    this.dataNotification.notifyDataChange();
    return res;
  }

  async closePeriod(accountId: number, period: string): Promise<any> {
    return this.db.handleApi('closePeriod', accountId, period);
  }

  async recategorizeMovements(): Promise<{ updatedCount: number }> {
    return this.db.handleApi<{ updatedCount: number }>('recategorizeMovements');
  }
}
