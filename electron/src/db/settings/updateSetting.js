import { dbRun } from "../../services/database.services.js";

export async function updateSetting(_, key, value) {
    const strValue = typeof value === 'boolean' ? String(value) : value;
    return await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, strValue]);
}
