export type TransactionType = 'credit' | 'debit' | 'transfer';

/** Resultado de um SELECT na tabela transactions */
export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  description: string;
  /** Histórico bruto importado do OFX */
  originalDescription: string | null;
  amount: number;
  type: TransactionType;
  /** Data no formato ISO ou YYYY-MM-DD */
  date: string;
  ignored: boolean | null;
  /** Para transferências entre contas do próprio usuário */
  transferAccountId: string | null;
  /** Identificador único do OFX para evitar duplicados */
  fitId: string | null;
  createdAt: string | null;
}

/** Payload para INSERT na tabela transactions */
export interface NewTransaction {
  id?: string;
  accountId: string;
  categoryId?: string | null;
  description: string;
  originalDescription?: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  ignored?: boolean | null;
  transferAccountId?: string | null;
  fitId?: string | null;
  createdAt?: string | null;
}

/**
 * Representa uma transação exatamente como ela vem de um arquivo OFX,
 * antes de qualquer mapeamento para o schema do banco de dados.
 *
 * Campos derivados do NormalizedTransaction (ofx-data-extractor) +
 * campos brutos do bloco <STMTTRN> da especificação OFX 2.x.
 */
export interface ImportedTransaction {
  // ── Identificação ────────────────────────────────────────────────────────
  /** <FITID> — ID único da transação gerado pela instituição financeira */
  fitId: string;

  // ── Origem ───────────────────────────────────────────────────────────────
  /** Tipo de conta da qual a transação foi extraída */
  source: 'bank' | 'credit_card';

  // ── Valor ────────────────────────────────────────────────────────────────
  /** <TRNAMT> — Valor com sinal (negativo = débito, positivo = crédito) */
  amount: number | string | null;
  /** Valor absoluto (sem sinal) */
  amountAbs: number;
  /** Direção normalizada derivada do sinal ou <TRNTYPE> */
  direction: 'credit' | 'debit';
  /** <CURDEF> — Moeda da conta. Ex: 'BRL', 'USD' */
  currency: string | null;

  // ── Datas ────────────────────────────────────────────────────────────────
  /** <DTPOSTED> — Data em que a transação foi lançada na conta */
  postedAt: string | number | Date | null;
  /** <DTAVAIL> — Data de disponibilidade dos fundos (opcional, raro) */
  dtAvail?: string | null;

  // ── Tipo de transação OFX ─────────────────────────────────────────────────
  /**
   * <TRNTYPE> — Tipo bruto OFX.
   * Valores possíveis: CREDIT, DEBIT, INT, DIV, FEE, SRVCHG, DEP, ATM, POS,
   * XFER, CHECK, PAYMENT, CASH, DIRECTDEP, DIRECTDEBIT, REPEATPMT, OTHER
   */
  trnType?: string | null;

  // ── Descrição ─────────────────────────────────────────────────────────────
  /** <NAME> ou <MEMO> — Descrição bruta como está no arquivo */
  description: string;
  /** Descrição normalizada/limpa pela biblioteca */
  descriptionNormalized: string;
  /** <MEMO> — Campo memo adicional (complementa o NAME, quando presente) */
  memo?: string | null;

  // ── Cheque / referência ───────────────────────────────────────────────────
  /** <CHECKNUM> — Número do cheque (quando a transação é um cheque) */
  checkNum?: string | null;

  // ── Instituição financeira ────────────────────────────────────────────────
  /**
   * Dados da instituição.
   * Campos comuns: { org: string; fid?: string }
   * Vem do bloco <FI> dentro de <SONRS> ou <BANKACCTFROM>
   */
  institution: {
    org?: string;
    fid?: string;
    [key: string]: unknown;
  } | null;

  // ── Conta ────────────────────────────────────────────────────────────────
  /**
   * Dados da conta de origem.
   * Campos comuns: { accountId: string; bankId?: string; acctType?: string }
   * Vem do bloco <BANKACCTFROM> ou <CCACCTFROM>
   */
  account: {
    accountId?: string;
    bankId?: string;
    /** Tipo da conta: CHECKING, SAVINGS, CREDITLINE, MONEYMRKT */
    acctType?: string;
    [key: string]: unknown;
  } | null;

  // ── Dados brutos ──────────────────────────────────────────────────────────
  /**
   * Objeto com todos os campos brutos do bloco <STMTTRN> sem transformação.
   * Útil para acessar campos não mapeados (ex: REFNUM, CORRECTFITID, etc.)
   */
  raw: Record<string, unknown>;

  // ── Diagnóstico ───────────────────────────────────────────────────────────
  /** Avisos gerados pelo parser para esta transação específica */
  warnings: Array<{
    code: string;
    message: string;
    severity: 'warning' | 'error';
    path?: string;
    context?: string;
  }>;

  // ── Estado temporário de revisão no app ─────────────────────────────────────
  ignored?: boolean;
  categoryId?: string | null;
}