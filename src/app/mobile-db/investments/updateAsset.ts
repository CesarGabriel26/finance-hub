// @ts-nocheck
import {  dbRun  } from '../../services/mobile-sqlite.service';

export async function updateAsset(_, id, asset) {
    const { name, type, objective_value, benchmark, index_type, index_percentage, initial_balance, status } = asset;
    return await dbRun(
        "UPDATE assets SET name = ?, type = ?, objective_value = ?, benchmark = ?, index_type = ?, index_percentage = ?, initial_balance = ?, status = ? WHERE id = ?",
        [name, type, objective_value, benchmark || null, index_type || null, index_percentage || null, initial_balance || 0, status || 'active', id]
    );
}
