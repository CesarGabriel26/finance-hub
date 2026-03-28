import { dbAll } from "../../services/database.services.js";

export async function getMovements(_, accountId, period) {
    return await dbAll(`
        SELECT m.*, c.name as category_name
        FROM movements m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.account_id = ? AND m.period = ? 
        ORDER BY m.order_index ASC, m.date ASC
    `, [accountId, period]);
}
