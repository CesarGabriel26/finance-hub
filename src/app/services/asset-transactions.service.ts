import { Injectable } from '@angular/core';
import type { AssetTransaction, NewAssetTransaction } from '../models/asset-transaction.model';

@Injectable({ providedIn: 'root' })
export class AssetTransactionsService {
  private get api() {
    return window.AssetTransactionsApi!;
  }

  /**
   * Lista todas as movimentações de um ativo, ordenadas por data decrescente.
   */
  getAll(assetId: string): Promise<AssetTransaction[]> {
    return this.api.getAll(assetId);
  }

  /** Retorna uma movimentação pelo ID ou null */
  getById(id: string): Promise<AssetTransaction | null> {
    return this.api.getById(id);
  }

  /** Registra uma compra, venda, dividendo ou juros */
  insert(data: NewAssetTransaction): Promise<AssetTransaction> {
    return this.api.insert(data);
  }

  /** Corrige campos de uma movimentação existente */
  update(id: string, data: Partial<NewAssetTransaction>): Promise<AssetTransaction | null> {
    return this.api.update(id, data);
  }

  /** Remove uma movimentação pelo ID */
  delete(id: string): Promise<AssetTransaction | null> {
    return this.api.delete(id);
  }
}
