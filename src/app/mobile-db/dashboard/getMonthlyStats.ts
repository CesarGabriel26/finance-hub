// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getMonthlyStats(_, months = 12) {
    return await dbAll(`
        SELECT period, SUM(amount) as total_revenue
        FROM movements
        WHERE type = 'C'
        GROUP BY period
        ORDER BY period DESC
        LIMIT ?
    `, [months]);
}
