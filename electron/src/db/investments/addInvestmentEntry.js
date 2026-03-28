import { dbRun } from "../../services/database.services.js";
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function addInvestmentEntry(_, entry) {
    const { account_id, asset_id, type, amount, date, description } = entry;
    
    const result = await dbRun(
        "INSERT INTO investment_entries (account_id, asset_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)",
        [account_id, asset_id, type, amount, date, description]
    );

    await recalculateAccountBalance(account_id);

    return result;
}
