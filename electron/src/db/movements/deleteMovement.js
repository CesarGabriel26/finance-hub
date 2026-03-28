import { dbRun, dbGet } from "../../services/database.services.js";
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function deleteMovement(_, id, skipRecalculation = false) {
    const mov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
    if (!mov) return { success: false };

    await dbRun("DELETE FROM movements WHERE id = ?", [id]);

    if (!skipRecalculation) {
        await recalculateAccountBalance(mov.account_id);
    }

    return { success: true };
}
