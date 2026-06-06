import type { CategoryType } from './category.model';

export type AiCategorizationProvider = 'openai' | 'gemini';

export interface AiCategorizationCategory {
  id: string;
  name: string;
  type: CategoryType;
}

export interface AiCategorizationTransaction {
  fitId: string;
  description: string;
  originalDescription?: string | null;
  memo?: string | null;
  amount: number;
  direction: 'credit' | 'debit';
  date?: string | null;
}

export interface AiCategorizationRequest {
  categories: AiCategorizationCategory[];
  transactions: AiCategorizationTransaction[];
}

export interface AiCategorizationSuggestion {
  fitId: string;
  categoryId: string;
  confidence: number;
  reason: string;
  keywords: string[];
}

export interface AiCategorizationResult {
  provider: AiCategorizationProvider;
  model: string;
  items: AiCategorizationSuggestion[];
}
