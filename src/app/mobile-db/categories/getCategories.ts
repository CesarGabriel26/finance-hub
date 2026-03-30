// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getCategories() {
    return await dbAll("SELECT * FROM categories ORDER BY name");
}
