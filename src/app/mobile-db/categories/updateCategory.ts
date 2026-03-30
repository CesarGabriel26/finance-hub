// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateCategory(_, id, category) {
    return await dbRun(
        "UPDATE categories SET name = ?, type = ?, is_fixed = ? WHERE id = ?",
        [category.name, category.type, category.is_fixed ? 1 : 0, id]
    );
}
