import { dbRun } from "../../services/database.services.js";

export async function deleteKeyword(_, id) {
    return await dbRun("DELETE FROM keywords WHERE id = ?", [id]);
}
