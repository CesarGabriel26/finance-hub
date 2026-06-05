"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJsonFilter = buildJsonFilter;
exports.buildTableFilter = buildTableFilter;
const drizzle_orm_1 = require("drizzle-orm");
const OPERATORS = new Set([
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'notLike',
    'in', 'notIn',
    'between', 'notBetween',
    'isNull', 'isNotNull'
]);
function isOperatorObject(val) {
    if (typeof val !== 'object' || val === null || Array.isArray(val)) {
        return false;
    }
    const keys = Object.keys(val);
    if (keys.length === 0)
        return false;
    return keys.some(key => OPERATORS.has(key));
}
function parseRange(val) {
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
function formatLikeValue(val) {
    const str = String(val);
    if (str.includes('%')) {
        return str;
    }
    return `%${str}%`;
}
function buildCondition(target, opName, opValue) {
    switch (opName) {
        case 'eq':
            return (0, drizzle_orm_1.eq)(target, opValue);
        case 'ne':
            return (0, drizzle_orm_1.ne)(target, opValue);
        case 'gt':
            return (0, drizzle_orm_1.gt)(target, opValue);
        case 'gte':
            return (0, drizzle_orm_1.gte)(target, opValue);
        case 'lt':
            return (0, drizzle_orm_1.lt)(target, opValue);
        case 'lte':
            return (0, drizzle_orm_1.lte)(target, opValue);
        case 'like':
            return (0, drizzle_orm_1.like)(target, formatLikeValue(opValue));
        case 'ilike':
            return (0, drizzle_orm_1.ilike)(target, formatLikeValue(opValue));
        case 'notLike':
            return (0, drizzle_orm_1.notLike)(target, formatLikeValue(opValue));
        case 'in':
            if (Array.isArray(opValue)) {
                if (opValue.length === 0) {
                    return (0, drizzle_orm_1.sql) `0 = 1`; // Always false
                }
                return (0, drizzle_orm_1.inArray)(target, opValue);
            }
            return undefined;
        case 'notIn':
            if (Array.isArray(opValue)) {
                if (opValue.length === 0) {
                    return (0, drizzle_orm_1.sql) `1 = 1`; // Always true
                }
                return (0, drizzle_orm_1.notInArray)(target, opValue);
            }
            return undefined;
        case 'between':
            if (Array.isArray(opValue) && opValue.length === 2) {
                return (0, drizzle_orm_1.between)(target, opValue[0], opValue[1]);
            }
            return undefined;
        case 'notBetween':
            if (Array.isArray(opValue) && opValue.length === 2) {
                return (0, drizzle_orm_1.notBetween)(target, opValue[0], opValue[1]);
            }
            return undefined;
        case 'isNull':
            return opValue ? (0, drizzle_orm_1.isNull)(target) : (0, drizzle_orm_1.isNotNull)(target);
        case 'isNotNull':
            return opValue ? (0, drizzle_orm_1.isNotNull)(target) : (0, drizzle_orm_1.isNull)(target);
        default:
            return undefined;
    }
}
function buildFilterInternal(table, filter, getTarget, currentPath = '') {
    const clauses = [];
    for (const key of Object.keys(filter)) {
        const value = filter[key];
        if (value === undefined)
            continue;
        // 1. Logical OR
        if (key === 'or') {
            const orClauses = [];
            if (Array.isArray(value)) {
                for (const item of value) {
                    const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
                    if (subFilter)
                        orClauses.push(subFilter);
                }
            }
            else if (typeof value === 'object' && value !== null) {
                for (const subKey of Object.keys(value)) {
                    const subFilter = buildFilterInternal(table, { [subKey]: value[subKey] }, getTarget, currentPath);
                    if (subFilter)
                        orClauses.push(subFilter);
                }
            }
            if (orClauses.length > 0) {
                clauses.push((0, drizzle_orm_1.or)(...orClauses));
            }
            continue;
        }
        // 2. Logical AND
        if (key === 'and') {
            const andClauses = [];
            if (Array.isArray(value)) {
                for (const item of value) {
                    const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
                    if (subFilter)
                        andClauses.push(subFilter);
                }
            }
            else if (typeof value === 'object' && value !== null) {
                for (const subKey of Object.keys(value)) {
                    const subFilter = buildFilterInternal(table, { [subKey]: value[subKey] }, getTarget, currentPath);
                    if (subFilter)
                        andClauses.push(subFilter);
                }
            }
            if (andClauses.length > 0) {
                clauses.push((0, drizzle_orm_1.and)(...andClauses));
            }
            continue;
        }
        // 3. Logical NOT
        if (key === 'not') {
            const notClauses = [];
            if (Array.isArray(value)) {
                for (const item of value) {
                    const subFilter = buildFilterInternal(table, item, getTarget, currentPath);
                    if (subFilter)
                        notClauses.push(subFilter);
                }
            }
            else if (typeof value === 'object' && value !== null) {
                for (const subKey of Object.keys(value)) {
                    const subFilter = buildFilterInternal(table, { [subKey]: value[subKey] }, getTarget, currentPath);
                    if (subFilter)
                        notClauses.push(subFilter);
                }
            }
            if (notClauses.length > 0) {
                clauses.push((0, drizzle_orm_1.not)((0, drizzle_orm_1.and)(...notClauses)));
            }
            continue;
        }
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        // 4. Operator object, nested fields, or primitive values
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (isOperatorObject(value)) {
                const target = getTarget(newPath);
                const opClauses = [];
                for (const opName of Object.keys(value)) {
                    const opValue = value[opName];
                    if (opValue === undefined)
                        continue;
                    let processedValue = opValue;
                    if (typeof opValue === 'boolean') {
                        processedValue = opValue ? 1 : 0;
                    }
                    else if ((opName === 'in' || opName === 'notIn') && Array.isArray(opValue)) {
                        processedValue = opValue.map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
                    }
                    else if (opName === 'between' || opName === 'notBetween') {
                        const range = parseRange(opValue);
                        if (range) {
                            processedValue = range.map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
                        }
                    }
                    const cond = buildCondition(target, opName, processedValue);
                    if (cond)
                        opClauses.push(cond);
                }
                if (opClauses.length > 0) {
                    clauses.push((0, drizzle_orm_1.and)(...opClauses));
                }
            }
            else {
                const subFilter = buildFilterInternal(table, value, getTarget, newPath);
                if (subFilter)
                    clauses.push(subFilter);
            }
        }
        else {
            const target = getTarget(newPath);
            let processedValue = value;
            if (typeof value === 'boolean') {
                processedValue = value ? 1 : 0;
            }
            const cond = (0, drizzle_orm_1.eq)(target, processedValue);
            clauses.push(cond);
        }
    }
    if (clauses.length === 0)
        return undefined;
    return (0, drizzle_orm_1.and)(...clauses);
}
/**
 * Transforma o objeto de filtro customizado em cláusulas SQL do Drizzle para um campo JSON.
 * @param table A tabela do Drizzle (ex: produtos)
 * @param jsonColumnName O nome da coluna JSON onde a busca será feita (ex: 'meta')
 * @param filter O objeto com os filtros
 */
function buildJsonFilter(table, jsonColumnName, filter) {
    return buildFilterInternal(table, filter, (path) => {
        const column = table[jsonColumnName];
        if (!column) {
            throw new Error(`Column "${jsonColumnName}" not found on table.`);
        }
        return (0, drizzle_orm_1.sql) `json_extract(${column}, ${`$.${path}`})`;
    });
}
/**
 * Transforma o objeto de filtro customizado em cláusulas SQL do Drizzle para colunas diretas da tabela.
 * @param table A tabela do Drizzle (ex: produtos)
 * @param filter O objeto com os filtros
 */
function buildTableFilter(table, filter) {
    return buildFilterInternal(table, filter, (path) => {
        const columnName = path.split('.')[0];
        const column = table[columnName];
        if (!column) {
            throw new Error(`Column "${columnName}" not found on table.`);
        }
        return column;
    });
}
