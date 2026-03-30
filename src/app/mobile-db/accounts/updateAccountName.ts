// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateAccountName(_, id, name) {
    return await dbRun("UPDATE accounts SET name = ? WHERE id = ?", [name, id]);
}
