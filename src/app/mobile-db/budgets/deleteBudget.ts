// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteBudget(_, id) {
    return await dbRun("DELETE FROM budgets WHERE id = ?", [id]);
}
