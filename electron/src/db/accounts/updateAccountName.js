import { dbRun } from "../../services/database.services.js";

export async function updateAccountName(_, id, name) {
    return await dbRun("UPDATE accounts SET name = ? WHERE id = ?", [name, id]);
}
