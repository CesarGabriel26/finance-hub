// @ts-nocheck
import {  dbRun, dbGet  } from '../../services/mobile-sqlite.service';

export async function recalculateAccountBalance(accountId) {
    // Obter o primeiro AC
    const firstAC = await dbGet(`
        SELECT amount FROM movements 
        WHERE account_id = ? AND type = 'AC' 
        ORDER BY date ASC, order_index ASC, id ASC LIMIT 1
    `, [accountId]);

    // Obter saldo das outras movimentações (Ignorando todos os ACs extras)
    const result = await dbGet(`
        SELECT 
            SUM(CASE WHEN type = 'C' THEN amount WHEN type = 'D' THEN -amount ELSE 0 END) as total 
        FROM movements 
        WHERE account_id = ? AND type != 'AC'
    `, [accountId]);

    const balance = (firstAC ? firstAC.amount : 0) + (result?.total || 0);

    await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [balance, accountId]);
}
