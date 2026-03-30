// @ts-nocheck
import {  dbRun, dbGet  } from '../../services/mobile-sqlite.service';
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function deleteInvestmentEntry(_, id) {
    const entry = await dbGet("SELECT * FROM investment_entries WHERE id = ?", [id]);
    if (!entry) return { success: false };

    await dbRun("DELETE FROM investment_entries WHERE id = ?", [id]);
    await recalculateAccountBalance(entry.account_id);

    return { success: true };
}
