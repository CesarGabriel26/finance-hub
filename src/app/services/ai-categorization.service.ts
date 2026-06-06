import { Injectable } from '@angular/core';
import type {
  AiCategorizationRequest,
  AiCategorizationResult,
} from '../models/ai-categorization.model';

@Injectable({ providedIn: 'root' })
export class AiCategorizationService {
  private get api() {
    return window.AiCategorizationApi!;
  }

  categorize(data: AiCategorizationRequest): Promise<AiCategorizationResult> {
    return this.api.categorize(data);
  }
}
