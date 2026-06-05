import { Injectable } from '@angular/core';
import type { Asset, NewAsset } from '../models/asset.model';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  private get api() {
    return window.AssetsApi!;
  }

  /** Lista todos os ativos cadastrados (ações, FIIs, CDBs, etc.) */
  getAll(): Promise<Asset[]> {
    return this.api.getAll();
  }

  /** Retorna um ativo pelo ID ou null */
  getById(id: string): Promise<Asset | null> {
    return this.api.getById(id);
  }

  /** Cadastra um novo ativo */
  insert(data: NewAsset): Promise<Asset> {
    return this.api.insert(data);
  }

  /** Atualiza campos de um ativo existente */
  update(id: string, data: Partial<NewAsset>): Promise<Asset | null> {
    return this.api.update(id, data);
  }

  /** Remove um ativo (cascata nas movimentações vinculadas) */
  delete(id: string): Promise<Asset | null> {
    return this.api.delete(id);
  }
}
