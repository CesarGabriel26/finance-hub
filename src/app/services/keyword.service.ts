import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Keyword, KeywordRule } from '../models/database.models';

@Injectable({
  providedIn: 'root'
})
export class KeywordService {
  private db = inject(DatabaseService);

  async getKeywords(): Promise<Keyword[]> {
    return this.db.handleApi<Keyword[]>('getKeywords');
  }

  async addKeyword(keyword: string, categoryId: number): Promise<any> {
    return this.db.handleApi('addKeyword', keyword, categoryId);
  }

  async deleteKeyword(id: number): Promise<any> {
    return this.db.handleApi('deleteKeyword', id);
  }

  async getKeywordRules(): Promise<KeywordRule[]> {
    return this.db.handleApi<KeywordRule[]>('getKeywordRules');
  }

  async addKeywordRule(rule: Partial<KeywordRule>): Promise<any> {
    return this.db.handleApi('addKeywordRule', rule);
  }

  async deleteKeywordRule(id: number): Promise<any> {
    return this.db.handleApi('deleteKeywordRule', id);
  }
}
