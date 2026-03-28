import { dbAll } from "../../services/database.services.js";

export async function getSettings() {
    const rows = await dbAll("SELECT * FROM settings");
    const settings = {};
    rows.forEach(row => {
        settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
    });
    return settings;
}
