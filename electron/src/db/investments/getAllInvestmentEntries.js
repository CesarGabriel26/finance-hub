import { dbAll } from "../../services/database.services.js";

export async function getAllInvestmentEntries() {
    return await dbAll(`
        SELECT ie.*, acc.name as account_name, a.name as asset_name
        FROM investment_entries ie
        JOIN accounts acc ON ie.account_id = acc.id
        JOIN assets a ON ie.asset_id = a.id
        ORDER BY ie.date DESC
    `);
}
