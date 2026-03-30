// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getAccounts() {
    return await dbAll("SELECT * FROM accounts ORDER BY name");
}
