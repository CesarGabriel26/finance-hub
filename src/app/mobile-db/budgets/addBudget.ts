// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function addBudget(_, budget) {
    const { category_id, monthly_limit, month, year, alert_threshold_percentage } = budget;
    return await dbRun(
        "INSERT OR REPLACE INTO budgets (category_id, monthly_limit, month, year, alert_threshold_percentage) VALUES (?, ?, ?, ?, ?)",
        [category_id, monthly_limit, month, year, alert_threshold_percentage || 80]
    );
}
