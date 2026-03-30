// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getDashboardData(_, period, filters = {}) {
    let query = `
        SELECT m.type, m.category_id, c.name as category_name, SUM(ABS(m.amount)) as total
        FROM movements m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.period = ? AND m.type IN ('C', 'D')
    `;
    let params = [period];
    if (filters.accountId) { query += ` AND m.account_id = ?`; params.push(filters.accountId); }
    if (filters.categoryId) { query += ` AND m.category_id = ?`; params.push(filters.categoryId); }
    if (filters.type) { query += ` AND m.type = ?`; params.push(filters.type); }
    
    query += ` GROUP BY m.type, m.category_id, c.name`;
    return await dbAll(query, params);
}
