import { dbRun } from "../../services/database.services.js";

export async function addCategory(_, category) {
    return await dbRun("INSERT INTO categories (name, type, is_fixed) VALUES (?, ?, ?)", [category.name, category.type, category.is_fixed ? 1 : 0]);
}
