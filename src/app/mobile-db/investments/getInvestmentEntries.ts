// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getInvestmentEntries(_, assetId) {
    return await dbAll(`
        SELECT ie.*, acc.name as account_name
        FROM investment_entries ie
        JOIN accounts acc ON ie.account_id = acc.id
        WHERE ie.asset_id = ?
        ORDER BY ie.date DESC
    `, [assetId]);
}
