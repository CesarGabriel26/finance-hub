import { ipcMain } from 'electron';
import { getAppSettings } from './app-settings';
import type {
  AiCategorizationProvider,
  AiCategorizationRequest,
  AiCategorizationResult,
  AiCategorizationSuggestion,
} from '../../src/app/models/ai-categorization.model';

type JsonSchema = Record<string, unknown>;

interface ProviderConfig {
  provider: AiCategorizationProvider;
  apiKey: string;
  model: string;
}

export function registerAiCategorizationHandlers(): void {
  ipcMain.handle('ai-categorization:categorize', async (_, request: AiCategorizationRequest) =>
    categorizeImportedTransactions(request),
  );
}

async function categorizeImportedTransactions(
  request: AiCategorizationRequest,
): Promise<AiCategorizationResult> {
  validateRequest(request);
  const config = providerConfig();

  if (config.provider === 'openai') {
    return categorizeWithOpenAi(config, request);
  }

  return categorizeWithGemini(config, request);
}

function providerConfig(): ProviderConfig {
  const settings = getAppSettings();

  if (!settings.aiCategorizationEnabled) {
    throw new Error('Ative a categorizacao por IA nas configuracoes antes de usar este recurso.');
  }

  if (settings.aiCategorizationProvider === 'gemini') {
    return {
      provider: 'gemini',
      apiKey: settings.geminiApiKey || process.env['GEMINI_API_KEY'] || process.env['GOOGLE_API_KEY'] || '',
      model: settings.geminiModel || 'gemini-3.5-flash',
    };
  }

  return {
    provider: 'openai',
    apiKey: settings.openAiApiKey || process.env['OPENAI_API_KEY'] || '',
    model: settings.openAiModel || 'gpt-5.4-nano',
  };
}

async function categorizeWithOpenAi(
  config: ProviderConfig,
  request: AiCategorizationRequest,
): Promise<AiCategorizationResult> {
  if (!config.apiKey) {
    throw new Error('Informe a OpenAI API Key nas configuracoes ou em OPENAI_API_KEY.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      instructions: categorizationInstructions(),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: categorizationPrompt(request),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'transaction_categorization',
          strict: true,
          schema: categorizationSchema(true),
        },
      },
    }),
  });

  const payload = await parseProviderResponse(response, 'OpenAI');
  const text = extractOpenAiText(payload);

  return {
    provider: 'openai',
    model: config.model,
    items: normalizeSuggestions(text, request),
  };
}

async function categorizeWithGemini(
  config: ProviderConfig,
  request: AiCategorizationRequest,
): Promise<AiCategorizationResult> {
  if (!config.apiKey) {
    throw new Error('Informe a Gemini API Key nas configuracoes ou em GEMINI_API_KEY.');
  }

  const model = config.model.replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${categorizationInstructions()}\n\n${categorizationPrompt(request)}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseFormat: {
          text: {
            mimeType: 'application/json',
            schema: categorizationSchema(false),
          },
        },
      },
    }),
  });

  const payload = await parseProviderResponse(response, 'Gemini');
  const text = extractGeminiText(payload);

  return {
    provider: 'gemini',
    model: config.model,
    items: normalizeSuggestions(text, request),
  };
}

function validateRequest(request: AiCategorizationRequest): void {
  if (!request?.transactions?.length) {
    throw new Error('Nao ha transacoes importadas para categorizar.');
  }

  if (!request?.categories?.length) {
    throw new Error('Cadastre categorias antes de usar a categorizacao por IA.');
  }
}

function categorizationInstructions(): string {
  return [
    'Voce classifica transacoes financeiras brasileiras em categorias existentes.',
    'Use somente categoryId presente na lista de categorias.',
    'Respeite o tipo da transacao: credit usa categorias income; debit usa categorias expense.',
    'Se nao houver categoria confiavel, retorne categoryId como string vazia.',
    'keywords deve conter termos curtos que ajudariam a criar regras futuras.',
  ].join(' ');
}

function categorizationPrompt(request: AiCategorizationRequest): string {
  return JSON.stringify({
    categories: request.categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
    })),
    transactions: request.transactions.map(transaction => ({
      fitId: transaction.fitId,
      description: transaction.description,
      originalDescription: transaction.originalDescription ?? '',
      memo: transaction.memo ?? '',
      amount: transaction.amount,
      direction: transaction.direction,
      date: transaction.date ?? '',
    })),
  });
}

function categorizationSchema(strict: boolean): JsonSchema {
  const itemSchema: JsonSchema = {
    type: 'object',
    properties: {
      fitId: {
        type: 'string',
        description: 'Identificador da transacao importada.',
      },
      categoryId: {
        type: 'string',
        description: 'ID da categoria escolhida, ou string vazia quando nao houver confianca.',
      },
      confidence: {
        type: 'number',
        description: 'Confianca estimada entre 0 e 1.',
      },
      reason: {
        type: 'string',
        description: 'Motivo curto da classificacao.',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Termos curtos para regras automaticas futuras.',
      },
    },
    required: ['fitId', 'categoryId', 'confidence', 'reason', 'keywords'],
  };

  const schema: JsonSchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: itemSchema,
      },
    },
    required: ['items'],
  };

  if (strict) {
    itemSchema['additionalProperties'] = false;
    schema['additionalProperties'] = false;
  }

  return schema;
}

async function parseProviderResponse(response: Response, providerName: string): Promise<Record<string, unknown>> {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${providerName} retornou erro ${response.status}: ${providerErrorMessage(text)}`);
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`${providerName} retornou uma resposta invalida.`);
  }
}

function providerErrorMessage(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message ?? text;
  } catch {
    return text;
  }
}

function extractOpenAiText(payload: Record<string, unknown>): string {
  if (typeof payload['output_text'] === 'string') {
    return payload['output_text'];
  }

  const chunks: string[] = [];
  const output = Array.isArray(payload['output']) ? payload['output'] : [];

  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') chunks.push(text);
    }
  }

  if (chunks.length > 0) return chunks.join('\n');

  throw new Error('A OpenAI nao retornou texto para categorizar.');
}

function extractGeminiText(payload: Record<string, unknown>): string {
  const candidates = Array.isArray(payload['candidates']) ? payload['candidates'] : [];
  const chunks: string[] = [];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const content = (candidate as { content?: { parts?: unknown[] } }).content;
    const parts = Array.isArray(content?.parts) ? content.parts : [];

    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') chunks.push(text);
    }
  }

  if (chunks.length > 0) return chunks.join('\n');

  throw new Error('O Gemini nao retornou texto para categorizar.');
}

function normalizeSuggestions(
  text: string,
  request: AiCategorizationRequest,
): AiCategorizationSuggestion[] {
  const parsed = JSON.parse(text) as { items?: unknown } | unknown[];
  const rawItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
  const transactionIds = new Set(request.transactions.map(transaction => transaction.fitId));
  const categoryIds = new Set(request.categories.map(category => category.id));

  return rawItems
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map(item => {
      const fitId = typeof item['fitId'] === 'string' ? item['fitId'] : '';
      const categoryId = typeof item['categoryId'] === 'string' && categoryIds.has(item['categoryId'])
        ? item['categoryId']
        : '';
      const confidence = Number(item['confidence']);
      const keywords = Array.isArray(item['keywords'])
        ? item['keywords']
          .filter((keyword): keyword is string => typeof keyword === 'string')
          .map(keyword => keyword.trim())
          .filter(Boolean)
          .slice(0, 5)
        : [];

      return {
        fitId,
        categoryId,
        confidence: Number.isFinite(confidence) ? confidence : 0,
        reason: typeof item['reason'] === 'string' ? item['reason'] : '',
        keywords,
      };
    })
    .filter(item => transactionIds.has(item.fitId));
}
