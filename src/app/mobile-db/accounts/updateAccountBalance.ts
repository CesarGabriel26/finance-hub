// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateAccountBalance(_, id, balance) {
    return await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [balance, id]);
}
