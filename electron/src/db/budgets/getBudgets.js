import { dbAll } from "../../services/database.services.js";

export async function getBudgets(_, month, year) {
    let query = `
        SELECT b.*, c.name as category_name, c.type as category_type
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
    `;
    let params = [];
    if (month && year) {
        query += " WHERE b.month = ? AND b.year = ?";
        params.push(month, year);
    }
    query += " ORDER BY c.name ASC";
    return await dbAll(query, params);
}
