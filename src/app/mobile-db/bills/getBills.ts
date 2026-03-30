// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getBills(_, type, status = 'pending') {
    let query = `
        SELECT b.*, c.name as category_name 
        FROM bills b 
        LEFT JOIN categories c ON b.category_id = c.id 
        WHERE b.status = ?
    `;
    let params = [status];
    if (type) {
        query += " AND b.type = ?";
        params.push(type);
    }
    query += " ORDER BY b.due_date ASC";
    return await dbAll(query, params);
}
