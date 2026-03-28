import { dbRun } from "../../services/database.services.js";

export async function deleteCategory(_, id) {
    return await dbRun("DELETE FROM categories WHERE id = ?", [id]);
}
