// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateKeyword(_, id, keyword, category_id) {
    return await dbRun(
        "UPDATE keywords SET keyword = ?, category_id = ? WHERE id = ?", 
        [keyword, category_id, id]
    );
}
