// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getSettings() {
    const rows = await dbAll("SELECT * FROM settings");
    const settings = {};
    rows.forEach(row => {
        settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
    });
    return settings;
}
