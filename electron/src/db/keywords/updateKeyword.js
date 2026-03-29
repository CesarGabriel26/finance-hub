import { dbRun } from "../../services/database.services.js";

export async function updateKeyword(_, id, keyword, category_id) {
    return await dbRun(
        "UPDATE keywords SET keyword = ?, category_id = ? WHERE id = ?", 
        [keyword, category_id, id]
    );
}
