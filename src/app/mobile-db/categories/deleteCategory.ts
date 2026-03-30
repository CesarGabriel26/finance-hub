// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function deleteCategory(_, id) {
    return await dbRun("DELETE FROM categories WHERE id = ?", [id]);
}
