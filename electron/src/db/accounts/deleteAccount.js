import { dbRun } from "../../services/database.services.js";

export async function deleteAccount(_, id) {
    return await dbRun("DELETE FROM accounts WHERE id = ?", [id]);
}
