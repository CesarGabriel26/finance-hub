import { dbAll } from "../../services/database.services.js";

export async function checkDueBills() {
    const today = new Date();
    const nextThreeDays = new Date();
    nextThreeDays.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split('T')[0];
    const nextThreeDaysStr = nextThreeDays.toISOString().split('T')[0];

    return await dbAll(`
        SELECT b.*, c.name as category_name
        FROM bills b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.status = 'pending' AND b.due_date <= ? AND b.due_date >= ?
        ORDER BY b.due_date ASC
    `, [nextThreeDaysStr, todayStr]);
}
