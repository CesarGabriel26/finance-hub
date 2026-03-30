// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateSetting(_, key, value) {
    const strValue = typeof value === 'boolean' ? String(value) : value;
    return await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, strValue]);
}
