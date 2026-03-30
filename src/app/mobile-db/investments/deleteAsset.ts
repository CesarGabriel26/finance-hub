// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteAsset(_, id) {
    await dbRun("DELETE FROM asset_history WHERE asset_id = ?", [id]);
    await dbRun("DELETE FROM investment_entries WHERE asset_id = ?", [id]);
    return await dbRun("DELETE FROM assets WHERE id = ?", [id]);
}
