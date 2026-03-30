// @ts-nocheck
import {  dbRun, dbGet  } from '../../services/mobile-sqlite.service';
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function updateMovement(_, id, movement, skipRecalculation = false) {
    const { category_id, description, amount, date, type, classification_source, classification_rule_id, confidence } = movement;
    
    const oldMov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
    if (!oldMov) throw new Error("Movement not found");

    await dbRun(
        `UPDATE movements SET 
            category_id = ?, description = ?, amount = ?, date = ?, type = ?, 
            classification_source = ?, classification_rule_id = ?, confidence = ?
        WHERE id = ?`,
        [
            category_id !== undefined ? category_id : oldMov.category_id,
            description !== undefined ? description : oldMov.description,
            amount !== undefined ? amount : oldMov.amount,
            date !== undefined ? date : oldMov.date,
            type !== undefined ? type : oldMov.type,
            classification_source || oldMov.classification_source,
            classification_rule_id || oldMov.classification_rule_id,
            confidence !== undefined ? confidence : oldMov.confidence,
            id
        ]
    );

    if (!skipRecalculation) {
        await recalculateAccountBalance(oldMov.account_id);
    }

    return { success: true };
}
