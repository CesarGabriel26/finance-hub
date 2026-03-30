// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteKeyword(_, id) {
    return await dbRun("DELETE FROM keywords WHERE id = ?", [id]);
}
