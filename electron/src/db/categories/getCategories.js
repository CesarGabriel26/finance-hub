import { dbAll } from "../../services/database.services.js";

export async function getCategories() {
    return await dbAll("SELECT * FROM categories ORDER BY name");
}
