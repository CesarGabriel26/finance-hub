import { dbRun } from "../../services/database.services.js";

export async function deleteBill(_, id) {
    return await dbRun("DELETE FROM bills WHERE id = ?", [id]);
}
