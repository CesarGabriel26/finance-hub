// @ts-nocheck
import {  dbRun, dbGet  } from '../../services/mobile-sqlite.service';
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function addMovement(_, movement, skipRecalculation = false) {
    let { 
        account_id, category_id, description, amount, period, date, type, 
        order_index, classification_source, classification_rule_id, confidence 
    } = movement;

    if (type === 'AC') {
        const existingAC = await dbGet("SELECT id FROM movements WHERE account_id = ? AND period = ? AND type = 'AC'", [account_id, period]);
        if (existingAC) {
            // update existing instead of inserting
            await dbRun("UPDATE movements SET amount = ?, date = ?, description = ? WHERE id = ?", [amount, date, description, existingAC.id]);
            if (!skipRecalculation) await recalculateAccountBalance(account_id);
            return { id: existingAC.id, updated: true };
        }
    }

    // STRICT Duplicate Detection for all movements
    const normDesc = (description || "").trim().toUpperCase();
    const normAmount = Math.round(amount * 100) / 100;
    const normDate = date.substring(0, 10);

    const existingMatch = await dbGet(`
        SELECT id FROM movements 
        WHERE account_id = ? AND SUBSTR(date, 1, 10) = ? 
        AND ROUND(amount, 2) = ? AND UPPER(TRIM(description)) = ?
    `, [account_id, normDate, normAmount, normDesc]);

    if (existingMatch) {
        return { id: existingMatch.id, skipped: true };
    }

    const result = await dbRun(
        "INSERT INTO movements (account_id, category_id, description, amount, period, date, type, order_index, classification_source, classification_rule_id, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [account_id, category_id || null, description, amount, period, date, type, order_index !== undefined ? order_index : 2, classification_source || null, classification_rule_id || null, confidence || null]
    );

    if (!skipRecalculation) {
        await recalculateAccountBalance(account_id);
    }

    return result;
}
