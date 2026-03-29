import { dbGet, dbRun } from "../../services/database.services.js";

export async function addCategory(_, category) {
    const existing = await dbGet("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)", [category.name]);
    if (existing) {
        throw new Error(`A categoria "${category.name}" já existe.`);
    }
    return await dbRun("INSERT INTO categories (name, type, is_fixed) VALUES (?, ?, ?)", [category.name, category.type, category.is_fixed ? 1 : 0]);
}
