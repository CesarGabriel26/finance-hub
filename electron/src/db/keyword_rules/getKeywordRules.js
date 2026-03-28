import { dbAll } from "../../services/database.services.js";

export async function getKeywordRules() {
    return await dbAll(`
        SELECT kr.*, c.name as category_name
        FROM keyword_rules kr
        JOIN categories c ON kr.category_id = c.id
        ORDER BY kr.priority DESC, kr.keyword ASC
    `);
}
