export type DataFilterOperator =
  | 'eq'
  | 'ne'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'nin'
  | 'between'
  | 'exists';

export type FieldFilter = Partial<Record<DataFilterOperator, unknown>> & {
  and?: FieldFilter | FieldFilter[];
  or?: FieldFilter | FieldFilter[];
  not?: FieldFilter | FieldFilter[];
};

export type DataFilter<T = Record<string, unknown>> = {
  and?: DataFilter<T> | DataFilter<T>[];
  or?: DataFilter<T> | DataFilter<T>[];
  not?: DataFilter<T> | DataFilter<T>[];
} & Record<string, unknown>;

const fieldOperators = new Set<DataFilterOperator>([
  'eq',
  'ne',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'nin',
  'between',
  'exists',
]);

const logicalOperators = new Set(['and', 'or', 'not']);

export function filterRows<T>(
  rows: readonly T[],
  filter?: DataFilter<T> | null,
): readonly T[] {
  if (!filter || isEmptyObject(filter)) {
    return rows;
  }

  return rows.filter((row) => matchesFilter(row, filter));
}

export function matchesFilter<T>(row: T, filter: DataFilter<T>): boolean {
  if (!isRecord(filter) || isEmptyObject(filter)) {
    return true;
  }

  const fieldEntries = Object.entries(filter).filter(
    ([key, value]) => !logicalOperators.has(key) && value !== undefined,
  );

  const fieldsMatch = fieldEntries.every(([path, condition]) =>
    matchesFieldValue(getValueByPath(row, path), condition),
  );

  const andMatch = normalizeFilterGroup(filter.and, 'and').every((group) =>
    matchesFilter(row, group),
  );

  const orGroups = normalizeFilterGroup(filter.or, 'or');
  const orMatch = orGroups.length === 0 || orGroups.some((group) => matchesFilter(row, group));

  const notGroups = normalizeFilterGroup(filter.not, 'and');
  const notMatch = notGroups.length === 0 || !notGroups.some((group) => matchesFilter(row, group));

  return fieldsMatch && andMatch && orMatch && notMatch;
}

export function getValueByPath(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, source);
}

function matchesFieldValue(actual: unknown, condition: unknown): boolean {
  if (!isRecord(condition)) {
    return areEquivalent(actual, condition);
  }

  const operatorEntries = Object.entries(condition).filter(([key, value]) => {
    return fieldOperators.has(key as DataFilterOperator) && value !== undefined;
  });

  const nestedEntries = Object.entries(condition).filter(([key, value]) => {
    return !fieldOperators.has(key as DataFilterOperator) && !logicalOperators.has(key) && value !== undefined;
  });

  const operatorsMatch = operatorEntries.every(([operator, expected]) =>
    compareByOperator(actual, operator as DataFilterOperator, expected),
  );

  const nestedMatch =
    nestedEntries.length === 0 ||
    (isRecord(actual) &&
      nestedEntries.every(([path, nestedCondition]) =>
        matchesFieldValue(getValueByPath(actual, path), nestedCondition),
      ));

  const andMatch = normalizeFieldGroup(readFieldGroup(condition, 'and'), 'and').every((group) =>
    matchesFieldValue(actual, group),
  );

  const orGroups = normalizeFieldGroup(readFieldGroup(condition, 'or'), 'or');
  const orMatch =
    orGroups.length === 0 || orGroups.some((group) => matchesFieldValue(actual, group));

  const notGroups = normalizeFieldGroup(readFieldGroup(condition, 'not'), 'and');
  const notMatch =
    notGroups.length === 0 || !notGroups.some((group) => matchesFieldValue(actual, group));

  return operatorsMatch && nestedMatch && andMatch && orMatch && notMatch;
}

function compareByOperator(
  actual: unknown,
  operator: DataFilterOperator,
  expected: unknown,
): boolean {
  switch (operator) {
    case 'eq':
      return areEquivalent(actual, expected);
    case 'ne':
    case 'neq':
      return !areEquivalent(actual, expected);
    case 'gt':
      return compareComparableValues(actual, expected) > 0;
    case 'gte':
      return compareComparableValues(actual, expected) >= 0;
    case 'lt':
      return compareComparableValues(actual, expected) < 0;
    case 'lte':
      return compareComparableValues(actual, expected) <= 0;
    case 'contains':
      return containsValue(actual, expected);
    case 'startsWith':
      return normalizeText(actual).startsWith(normalizeText(expected));
    case 'endsWith':
      return normalizeText(actual).endsWith(normalizeText(expected));
    case 'in':
      return Array.isArray(expected) && expected.some((candidate) => areEquivalent(actual, candidate));
    case 'nin':
      return !Array.isArray(expected) || expected.every((candidate) => !areEquivalent(actual, candidate));
    case 'between':
      return isBetween(actual, expected);
    case 'exists':
      return Boolean(expected) === valueExists(actual);
  }
}

function containsValue(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual)) {
    return actual.some((item) => areEquivalent(item, expected));
  }

  return normalizeText(actual).includes(normalizeText(expected));
}

function isBetween(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(expected) || expected.length < 2) {
    return false;
  }

  const [min, max] = expected;

  return compareComparableValues(actual, min) >= 0 && compareComparableValues(actual, max) <= 0;
}

function areEquivalent(actual: unknown, expected: unknown): boolean {
  if (actual instanceof Date || expected instanceof Date) {
    const actualDate = toTime(actual);
    const expectedDate = toTime(expected);

    return actualDate !== null && expectedDate !== null && actualDate === expectedDate;
  }

  const actualNumber = toFiniteNumber(actual);
  const expectedNumber = toFiniteNumber(expected);

  if (actualNumber !== null && expectedNumber !== null) {
    return actualNumber === expectedNumber;
  }

  if (typeof actual === 'string' || typeof expected === 'string') {
    return normalizeText(actual) === normalizeText(expected);
  }

  return Object.is(actual, expected);
}

function compareComparableValues(actual: unknown, expected: unknown): number {
  if (actual instanceof Date || expected instanceof Date) {
    const actualDate = toTime(actual);
    const expectedDate = toTime(expected);

    if (actualDate !== null && expectedDate !== null) {
      return actualDate - expectedDate;
    }
  }

  const actualNumber = toFiniteNumber(actual);
  const expectedNumber = toFiniteNumber(expected);

  if (actualNumber !== null && expectedNumber !== null) {
    return actualNumber - expectedNumber;
  }

  return normalizeText(actual).localeCompare(normalizeText(expected), 'pt-BR');
}

function normalizeFilterGroup<T>(
  group: DataFilter<T> | DataFilter<T>[] | undefined,
  logicalOperator: 'and' | 'or',
): DataFilter<T>[] {
  if (!group) {
    return [];
  }

  if (Array.isArray(group)) {
    return group.filter(isRecord) as DataFilter<T>[];
  }

  if (logicalOperator === 'or' && isRecord(group) && !hasLogicalOperator(group)) {
    return Object.entries(group).map(([key, value]) => ({ [key]: value }) as DataFilter<T>);
  }

  return isRecord(group) ? [group as DataFilter<T>] : [];
}

function normalizeFieldGroup(
  group: FieldFilter | FieldFilter[] | undefined,
  logicalOperator: 'and' | 'or',
): unknown[] {
  if (!group) {
    return [];
  }

  if (Array.isArray(group)) {
    return group;
  }

  if (logicalOperator === 'or' && isRecord(group) && !hasLogicalOperator(group)) {
    return Object.entries(group).map(([key, value]) => ({ [key]: value }));
  }

  return [group];
}

function readFieldGroup(
  condition: Record<string, unknown>,
  key: 'and' | 'or' | 'not',
): FieldFilter | FieldFilter[] | undefined {
  const value = condition[key];

  if (!value) {
    return undefined;
  }

  return value as FieldFilter | FieldFilter[];
}

function hasLogicalOperator(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => logicalOperators.has(key));
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toTime(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function valueExists(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function isEmptyObject(value: object): boolean {
  return Object.keys(value).length === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
