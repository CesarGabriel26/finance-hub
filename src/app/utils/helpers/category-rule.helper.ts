export function autoCategorize(description: string): string {
    const d = description.toLowerCase();
    if (/uber|99taxis|cabify|posto|combustivel|pedagio|gasolina/.test(d)) return 'Transporte';
    if (/ifood|restaurante|mcdonald|cafe|starbucks|padaria|supermercado|carrefour|bistr|alimento|\bbar\b/.test(d)) return 'Alimentação';
    if (/aluguel|condominio|\bluz\b|energia|copasa|cemig|sabesp|internet|claro|vivo|\btim\b|\bgas\b/.test(d)) return 'Moradia';
    if (/salario|salário|recebido|rendimento|provento/.test(d)) return 'Receitas';
    if (/netflix|spotify|steam|cinema|hbo|disney|ingresso|\bjogo\b|lazer|shopping|livraria/.test(d)) return 'Lazer';
    if (/farmacia|drogaria|hospital|medico|consulta|exame|saude|dentista/.test(d)) return 'Saúde';
    return 'Outros';
}

export function capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export interface CategoryKeywordSource {
    description?: string | null;
    descriptionNormalized?: string | null;
    memo?: string | null;
}

const genericTransactionTokens = new Set([
    'agendamento',
    'aut',
    'auto',
    'automatico',
    'banco',
    'bilhete',
    'boleto',
    'brasil',
    'brl',
    'cart',
    'cartao',
    'cc',
    'compra',
    'conta',
    'credito',
    'deb',
    'debito',
    'doc',
    'eletronico',
    'estorno',
    'internet',
    'lancamento',
    'online',
    'pag',
    'pagamento',
    'parcel',
    'parcela',
    'pix',
    'pos',
    'recarga',
    'recebimento',
    'saque',
    'ted',
    'tef',
    'terminal',
    'transacao',
    'transfer',
    'transferencia',
    'valor',
]);

const broadSingleKeywords = new Set([
    'drogaria',
    'farmacia',
    'loja',
    'mercado',
    'posto',
    'restaurante',
    'supermercado',
]);

export function suggestCategoryRuleKeywords(source: CategoryKeywordSource): string[] {
    const text = [
        source.descriptionNormalized,
        source.description,
        source.memo,
    ].filter(Boolean).join(' ');
    const tokens = keywordTokens(text);

    if (tokens.length === 0) return [];

    const candidates = [
        tokens.slice(0, Math.min(2, tokens.length)).join(' '),
        tokens.length > 1 && broadSingleKeywords.has(tokens[0]) ? '' : tokens[0],
        tokens.slice(0, Math.min(3, tokens.length)).join(' '),
    ]
        .map(formatKeyword)
        .filter(keyword => keyword.length >= 3 && keyword.length <= 48);

    return [...new Set(candidates)].slice(0, 2);
}

export function transactionMatchesKeyword(source: CategoryKeywordSource, keyword: string): boolean {
    const haystack = normalizeKeywordText([
        source.descriptionNormalized,
        source.description,
        source.memo,
    ].filter(Boolean).join(' '));
    const needle = normalizeKeywordText(keyword);

    return Boolean(needle) && haystack.includes(needle);
}

function keywordTokens(value: string): string[] {
    const normalized = normalizeForTokens(value)
        .replace(/\bmercado\s+pago\b/g, ' ')
        .replace(/\bmercadopago\b/g, ' ')
        .replace(/\bpag\s*seguro\b/g, ' ')
        .replace(/\bpagseguro\b/g, ' ')
        .replace(/\b\d{2,}\b/g, ' ');

    return normalized
        .split(/\s+/)
        .map(token => token.trim())
        .filter(token => token.length >= 3)
        .filter(token => /[a-z]/.test(token))
        .filter(token => !genericTransactionTokens.has(token));
}

function normalizeForTokens(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .toLowerCase()
        .trim();
}

function normalizeKeywordText(value: string): string {
    return normalizeForTokens(value).replace(/\s+/g, '');
}

function formatKeyword(value: string): string {
    return capitalizeWords(value.replace(/\s+/g, ' ').trim());
}
