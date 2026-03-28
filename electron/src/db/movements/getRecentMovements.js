import { dbAll } from "../../services/database.services.js";

export async function getRecentMovements(_, limit = 5, filters = {}) {
    let query = `
        SELECT m.*, c.name as category_name, acc.name as account_name
        FROM movements m
        LEFT JOIN categories c ON m.category_id = c.id
        LEFT JOIN accounts acc ON m.account_id = acc.id
        WHERE m.type IN ('C', 'D')
    `;
    let params = [];
    if (filters.accountId) { query += ` AND m.account_id = ?`; params.push(filters.accountId); }
    if (filters.categoryId) { query += ` AND m.category_id = ?`; params.push(filters.categoryId); }
    if (filters.type) { query += ` AND m.type = ?`; params.push(filters.type); }
    if (filters.period) { query += ` AND m.period = ?`; params.push(filters.period); }

    query += ` ORDER BY m.date DESC LIMIT ?`;
    params.push(limit);
    return await dbAll(query, params);
}
