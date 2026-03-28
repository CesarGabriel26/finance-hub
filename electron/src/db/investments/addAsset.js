import { dbRun } from "../../services/database.services.js";

export async function addAsset(_, asset) {
    const { name, type, objective_value, benchmark, index_type, index_percentage, initial_balance } = asset;
    const initialVal = initial_balance || 0;
    return await dbRun(
        "INSERT INTO assets (name, type, objective_value, benchmark, index_type, index_percentage, initial_balance, current_value, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')",
        [name, type, objective_value, benchmark || null, index_type || null, index_percentage || null, initialVal, initialVal]
    );
}
