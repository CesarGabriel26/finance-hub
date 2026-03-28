import { dbAll } from "../../services/database.services.js";

export async function getKeywords() {
    return await dbAll(`
        SELECT k.*, c.name as category_name, c.type as category_type
        FROM keywords k 
        JOIN categories c ON k.category_id = c.id 
        ORDER BY k.keyword
    `);
}
