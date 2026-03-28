import { dbRun } from "../../services/database.services.js";

export async function updateCategory(_, id, category) {
    return await dbRun(
        "UPDATE categories SET name = ?, type = ?, is_fixed = ? WHERE id = ?",
        [category.name, category.type, category.is_fixed ? 1 : 0, id]
    );
}
