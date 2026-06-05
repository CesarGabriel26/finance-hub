import { Ofx } from 'ofx-data-extractor';
import { ImportedTransaction } from '../../models';
import { OfxParseResult } from '../../models/ofx.model';
import { capitalizeWords } from './category-rule.helper';

type OfxRecord = Record<string, unknown>;

function isRecord(value: unknown): value is OfxRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readField(source: unknown, keys: string[]): unknown {
  if (!source) return null;

  const normalizedKeys = keys.map(key => key.toLowerCase());
  const stack: unknown[] = [source];
  const visited = new Set<unknown>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    if (!isRecord(current)) continue;

    for (const [key, value] of Object.entries(current)) {
      if (normalizedKeys.includes(key.toLowerCase())) {
        return value;
      }
    }

    stack.push(...Object.values(current));
  }

  return null;
}

function readDirectField(source: unknown, keys: string[]): unknown {
  if (!isRecord(source)) return null;

  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }

  const normalizedKeys = keys.map(key => key.toLowerCase());
  const entry = Object.entries(source).find(([key]) => normalizedKeys.includes(key.toLowerCase()));
  return entry?.[1] ?? null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  const normalized = hasComma && (!hasDot || trimmed.lastIndexOf(',') > trimmed.lastIndexOf('.'))
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOfxDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value).trim();
  const ofxMatch = raw.match(/^(\d{4})(\d{2})(\d{2})/);

  if (ofxMatch) {
    const [, year, month, day] = ofxMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(date: Date | null): string | null {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toPeriod(date: Date | null): string | null {
  return toIsoDate(date)?.slice(0, 7) ?? null;
}

function readString(source: unknown, keys: string[], fallback = ''): string {
  const value = readDirectField(source, keys) ?? readField(source, keys);
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

export async function parseAndNormalizeOfx(file: File): Promise<OfxParseResult> {
  const ofx = await Ofx.fromBlob(file);
  const rawData = ofx.toJson() as OfxRecord;
  const normalizedData = ofx.toNormalized({ amountMode: 'number', dateMode: 'iso' });

  if (!normalizedData?.transactions || normalizedData.transactions.length === 0) {
    throw new Error('Nenhuma transacao encontrada no arquivo OFX.');
  }

  const transactions: ImportedTransaction[] = normalizedData.transactions.map((tx) => {
    const raw = tx.raw ?? {};

    return {
      fitId: tx.fitId,
      source: tx.source,
      amount: tx.amount,
      amountAbs: Number(tx.amountAbs ?? 0),
      direction: tx.direction,
      currency: tx.currency ?? null,
      postedAt: tx.postedAt,
      dtAvail: (raw['DTAVAIL'] as string | undefined) ?? null,
      trnType: (raw['TRNTYPE'] as string | undefined) ?? null,
      description: tx.description,
      descriptionNormalized: capitalizeWords(tx.descriptionNormalized || tx.description || ''),
      memo: (raw['MEMO'] as string | undefined) ?? null,
      checkNum: (raw['CHECKNUM'] as string | undefined) ?? null,
      institution: tx.institution as ImportedTransaction['institution'],
      account: tx.account as ImportedTransaction['account'],
      raw,
      warnings: tx.warnings ?? [],
    };
  });

  const toMs = (transaction: ImportedTransaction) =>
    transaction.postedAt ? new Date(transaction.postedAt as string).getTime() : 0;

  transactions.sort((a, b) => toMs(b) - toMs(a));

  const firstTx = transactions[0];
  const dates = transactions.map(toMs).filter(Boolean);
  const periodStartFromOfx = parseOfxDate(readField(rawData, ['DTSTART']));
  const periodEndFromOfx = parseOfxDate(readField(rawData, ['DTEND']));
  const periodStart = periodStartFromOfx ?? new Date(Math.min(...dates));
  const periodEnd = periodEndFromOfx ?? new Date(Math.max(...dates));
  const finalBalance = toNumber(readField(rawData, ['BALAMT']));
  const balanceDate = parseOfxDate(readField(rawData, ['DTASOF']));
  const totalCredits = transactions
    .filter(tx => tx.direction === 'credit')
    .reduce((sum, tx) => sum + Number(tx.amountAbs ?? 0), 0);
  const totalDebits = transactions
    .filter(tx => tx.direction === 'debit')
    .reduce((sum, tx) => sum + Number(tx.amountAbs ?? 0), 0);
  const netAmount = totalCredits - totalDebits;
  const initialBalance = finalBalance === null ? null : finalBalance - netAmount;
  const statementPeriod = toPeriod(periodEnd) ?? toPeriod(periodStart) ?? new Date().toISOString().slice(0, 7);
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const institutionBankId = readString(firstTx?.institution, ['FID', 'fid'], readString(rawData, ['FID'], '')) || null;
  const accountBankId = readString(firstTx?.account, ['BANKID', 'bankId'], readString(rawData, ['BANKID'], '')) || null;

  return {
    fileName: file.name,
    transactions,
    institution: {
      bankName: readString(
        firstTx?.institution,
        ['ORG', 'org'],
        readString(rawData, ['ORG'], 'Banco Importado'),
      ),
      bankId: institutionBankId ?? accountBankId,
    },
    currency: firstTx?.currency ?? null,
    account: {
      bankId: accountBankId,
      accountNumber: readString(firstTx?.account, ['ACCTID', 'accountId'], '') || null,
      accountType: readString(firstTx?.account, ['ACCTTYPE', 'acctType'], '') || null,
    },
    periodStart,
    periodEnd,
    statementPeriod,
    initialBalance,
    finalBalance,
    balanceDate,
    totalCredits,
    totalDebits,
    netAmount,
    isComplete: finalBalance !== null && statementPeriod < currentPeriod,
    warnings: normalizedData.warnings ?? [],
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(Math.max(0, decimals)))} ${sizes[index]}`;
}
