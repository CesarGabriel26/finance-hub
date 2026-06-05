import {
  SQL,
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  notLike,
  inArray,
  notInArray,
  between,
  notBetween,
  isNull,
  isNotNull,
  sql
} from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';

// 1. Operator value type definition
export type FilterOperatorValue = {
  eq?: any;
  ne?: any;
  lt?: any;
  lte?: any;
  gt?: any;
  gte?: any;
  like?: string;
  ilike?: string;
  notLike?: string;
  in?: any[];
  notIn?: any[];
  between?: [any, any] | { min: any; max: any } | { from: any; to: any } | { start: any; end: any };
  notBetween?: [any, any] | { min: any; max: any } | { from: any; to: any } | { start: any; end: any };
  isNull?: boolean;
  isNotNull?: boolean;
};

// 2. Filter input type definition
export type FilterInput = {
  [key: string]: FilterOperatorValue | FilterInput | FilterInput[] | any;
  or?: FilterInput | FilterInput[];
  and?: FilterInput | FilterInput[];
  not?: FilterInput | FilterInput[];
};

const OPERATORS = new Set([
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
  'like', 'ilike', 'notLike',
  'in', 'notIn',
  'between', 'notBetween',
  'isNull', 'isNotNull'
]);

function isOperatorObject(val: any): boolean {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    return false;
  }
  const keys = Object.keys(val);
  if (keys.length === 0) return false;
  return keys.some(key => OPERATORS.has(key));
}

function parseRange(val: any): [any, any] | undefined {
  if (Array.isArray(val) && val.length === 2) {
    return [val[0], val[1]];
  }
  if (typeof val === 'object' && val !== null) {
    if ('min' in val && 'max' in val) {
      return [val.min, val.max];
    }
    if ('from' in val && 'to' in val) {
      return [val.from, val.to];
    }
    if ('start' in val && 'end' in val) {
      return [val.start, val.end];
    }
  }
  return undefined;
}

function formatLikeValue(val: any): string {
  const str = String(val);
  if (str.includes('%')) {
    return str;
  }
  return `%${str}%`;
}

function buildCondition(
  target: any,
  opName: string,
  opValue: any
): SQL | undefined {
  switch (opName) {
    case 'eq':
      return eq(target, opValue);
    case 'ne':
      return ne(target, opValue);
    case 'gt':
      return gt(target, opValue);
    case 'gte':
      return gte(target, opValue);
    case 'lt':
      return lt(target, opValue);
    case 'lte':
      return lte(target, opValue);
    case 'like':
      return like(target, formatLikeValue(opValue));
    case 'ilike':
      return ilike(target, formatLikeValue(opValue));
    case 'notLike':
      return notLike(target, formatLikeValue(opValue));
    case 'in':
      if (Array.isArray(opValue)) {
        if (opValue.length === 0) {
          return sql`0 = 1`; // Always false
        }
        return inArray(target, opValue);
      }
      return undefined;
    case 'notIn':
      if (Array.isArray(opValue)) {
        if (opValue.length === 0) {
          return sql`1 = 1`; // Always true
        }
        return notInArray(target, opValue);
      }
      return undefined;
    case 'between':
      if (Array.isArray(opValue) && opValue.length === 2) {
        return between(target, opValue[0], opValue[1]);
      }
      return undefined;
    case 'notBetween':
      if (Array.isArray(opValue) && opValue.length === 2) {
        return notBetween(target, opValue[0], opValue[1]);
      }
      return undefined;
    case 'isNull':
      return opValue ? isNull(target) : isNotNull(target);
    case 'isNotNull':
      return opValue ? isNotNull(target) : isNull(target);
    default:
      return undefined;
  }
}

function buildFilterInternal(
  table: SQLiteTable,
  filter: FilterInput,
  getTarget: (path: string) => any,
  currentPath: string = ''
): SQL | undefined {
  const clauses: SQL[] = [];

  for (const key of Object.keys(filter)) {
    const value = filter[key];
    if (value === undefined) continue;

    // 1. Logical OR
    if (key === 'or') {
      const orClauses: SQL[] = [];
      if (Array.isArray(value)) {
        for (const item of value) {
          const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
          if (subFilter) orClauses.push(subFilter);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          const subFilter = buildFilterInternal(table, { [subKey]: (value as any)[subKey] }, getTarget, currentPath);
          if (subFilter) orClauses.push(subFilter);
        }
      }
      if (orClauses.length > 0) {
        clauses.push(or(...orClauses)!);
      }
      continue;
    }

    // 2. Logical AND
    if (key === 'and') {
      const andClauses: SQL[] = [];
      if (Array.isArray(value)) {
        for (const item of value) {
          const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
          if (subFilter) andClauses.push(subFilter);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          const subFilter = buildFilterInternal(table, { [subKey]: (value as any)[subKey] }, getTarget, currentPath);
          if (subFilter) andClauses.push(subFilter);
        }
      }
      if (andClauses.length > 0) {
        clauses.push(and(...andClauses)!);
      }
      continue;
    }

    // 3. Logical NOT
    if (key === 'not') {
      const notClauses: SQL[] = [];
      if (Array.isArray(value)) {
        for (const item of value) {
          const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
          if (subFilter) notClauses.push(subFilter);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          const subFilter = buildFilterInternal(table, { [subKey]: (value as any)[subKey] }, getTarget, currentPath);
          if (subFilter) notClauses.push(subFilter);
        }
      }
      if (notClauses.length > 0) {
        clauses.push(not(and(...notClauses)!)!);
      }
      continue;
    }

    const newPath = currentPath ? `${currentPath}.${key}` : key;

    // 4. Operator object, nested fields, or primitive values
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (isOperatorObject(value)) {
        const target = getTarget(newPath);
        const opClauses: SQL[] = [];

        for (const opName of Object.keys(value)) {
          const opValue = (value as any)[opName];
          if (opValue === undefined) continue;

          let processedValue = opValue;
          if (typeof opValue === 'boolean') {
            processedValue = opValue ? 1 : 0;
          } else if ((opName === 'in' || opName === 'notIn') && Array.isArray(opValue)) {
            processedValue = opValue.map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
          } else if (opName === 'between' || opName === 'notBetween') {
            const range = parseRange(opValue);
            if (range) {
              processedValue = range.map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
            }
          }

          const cond = buildCondition(target, opName, processedValue);
          if (cond) opClauses.push(cond);
        }

        if (opClauses.length > 0) {
          clauses.push(and(...opClauses)!);
        }
      } else {
        const subFilter = buildFilterInternal(table, value, getTarget, newPath);
        if (subFilter) clauses.push(subFilter);
      }
    } else {
      const target = getTarget(newPath);
      let processedValue = value;
      if (typeof value === 'boolean') {
        processedValue = value ? 1 : 0;
      }
      const cond = eq(target, processedValue);
      clauses.push(cond);
    }
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

/**
 * Transforma o objeto de filtro customizado em cláusulas SQL do Drizzle para um campo JSON.
 * @param table A tabela do Drizzle (ex: produtos)
 * @param jsonColumnName O nome da coluna JSON onde a busca será feita (ex: 'meta')
 * @param filter O objeto com os filtros
 */
export function buildJsonFilter(
  table: SQLiteTable,
  jsonColumnName: string,
  filter: FilterInput
): SQL | undefined {
  return buildFilterInternal(table, filter, (path) => {
    const column = (table as any)[jsonColumnName];
    if (!column) {
      throw new Error(`Column "${jsonColumnName}" not found on table.`);
    }
    return sql`json_extract(${column}, ${`$.${path}`})`;
  });
}

/**
 * Transforma o objeto de filtro customizado em cláusulas SQL do Drizzle para colunas diretas da tabela.
 * @param table A tabela do Drizzle (ex: produtos)
 * @param filter O objeto com os filtros
 */
export function buildTableFilter(
  table: SQLiteTable,
  filter: FilterInput
): SQL | undefined {
  return buildFilterInternal(table, filter, (path) => {
    const columnName = path.split('.')[0];
    const column = (table as any)[columnName];
    if (!column) {
      throw new Error(`Column "${columnName}" not found on table.`);
    }
    return column;
  });
}
