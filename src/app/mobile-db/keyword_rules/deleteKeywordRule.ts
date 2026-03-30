// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteKeywordRule(_, id) {
    return await dbRun("DELETE FROM keyword_rules WHERE id = ?", [id]);
}
