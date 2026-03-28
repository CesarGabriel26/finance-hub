import { dbRun } from "../../services/database.services.js";

export async function updateAccountBalance(_, id, balance) {
    return await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [balance, id]);
}
