import { dbRun } from "../../services/database.services.js";

export async function deleteBudget(_, id) {
    return await dbRun("DELETE FROM budgets WHERE id = ?", [id]);
}
