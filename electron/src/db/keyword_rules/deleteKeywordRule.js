import { dbRun } from "../../services/database.services.js";

export async function deleteKeywordRule(_, id) {
    return await dbRun("DELETE FROM keyword_rules WHERE id = ?", [id]);
}
