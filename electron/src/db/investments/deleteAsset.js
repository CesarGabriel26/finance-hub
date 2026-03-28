import { dbRun } from "../../services/database.services.js";

export async function deleteAsset(_, id) {
    await dbRun("DELETE FROM asset_history WHERE asset_id = ?", [id]);
    await dbRun("DELETE FROM investment_entries WHERE asset_id = ?", [id]);
    return await dbRun("DELETE FROM assets WHERE id = ?", [id]);
}
