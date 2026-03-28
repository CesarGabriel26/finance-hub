import { dbAll } from "../../services/database.services.js";

export async function getAssets() {
    const assets = await dbAll(`
        SELECT a.*, 
               (a.initial_balance + COALESCE(SUM(CASE WHEN ie.type = 'deposit' THEN ie.amount ELSE -ie.amount END), 0)) as total_invested
        FROM assets a
        LEFT JOIN investment_entries ie ON a.id = ie.asset_id
        GROUP BY a.id
        ORDER BY a.name
    `);

    return assets;
}
