// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function addAccount(_, account) {
    return await dbRun("INSERT INTO accounts (name, balance) VALUES (?, ?)", [account.name, account.balance || 0]);
}
