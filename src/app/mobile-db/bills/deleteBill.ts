// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteBill(_, id) {
    return await dbRun("DELETE FROM bills WHERE id = ?", [id]);
}
