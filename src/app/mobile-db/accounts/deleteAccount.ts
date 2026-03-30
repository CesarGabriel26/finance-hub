// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteAccount(_, id) {
    return await dbRun("DELETE FROM accounts WHERE id = ?", [id]);
}
