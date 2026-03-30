// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function addKeyword(_, keyword, category_id) {
    return await dbRun(
        "INSERT INTO keywords (keyword, category_id) VALUES (?, ?)", 
        [keyword, category_id]
    );
}
