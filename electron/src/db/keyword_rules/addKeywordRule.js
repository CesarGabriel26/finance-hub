import { dbRun } from "../../services/database.services.js";

export async function addKeywordRule(_, rule) {
    const { keyword, category_id, priority, created_by_user } = rule;
    return await dbRun(
        "INSERT INTO keyword_rules (keyword, category_id, priority, created_by_user) VALUES (?, ?, ?, ?)",
        [keyword, category_id, priority || 0, created_by_user ? 1 : 0]
    );
}
