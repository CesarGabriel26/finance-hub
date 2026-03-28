import { dbAll } from "../../services/database.services.js";

export async function getDashboardEvolution(_, periods, filters = {}) {
    const placeholders = periods.map(() => '?').join(',');
    let query = `
        SELECT 
            period, 
            SUM(CASE WHEN type = 'D' THEN ABS(amount) ELSE 0 END) as total_expense,
            SUM(CASE WHEN type = 'C' THEN ABS(amount) ELSE 0 END) as total_revenue
        FROM movements m
        WHERE period IN (${placeholders}) AND type IN ('C', 'D')
    `;
    let params = [...periods];
    if (filters.accountId) { query += ` AND m.account_id = ?`; params.push(filters.accountId); }
    if (filters.categoryId) { query += ` AND m.category_id = ?`; params.push(filters.categoryId); }
    if (filters.type) { query += ` AND m.type = ?`; params.push(filters.type); }

    query += ` GROUP BY period`;
    return await dbAll(query, params);
}
