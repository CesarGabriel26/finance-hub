// @ts-nocheck
import {  dbRun, dbGet, dbAll  } from '../../services/mobile-sqlite.service';

export async function closePeriod(_, accountId, period) {
    // Calculate balance: AC + sum(Credit) - sum(Debit)
    const ac = await dbGet("SELECT amount FROM movements WHERE account_id = ? AND period = ? AND type = 'AC'", [accountId, period]);
    const startBalance = ac ? ac.amount : 0;

    const movements = await dbAll("SELECT amount, type FROM movements WHERE account_id = ? AND period = ? AND type NOT IN ('AC', 'FC')", [accountId, period]);
    const totalMovements = movements.reduce((acc, m) => {
        return acc + (m.type === 'C' ? m.amount : -m.amount);
    }, 0);

    const finalBalance = startBalance + totalMovements;

    await dbRun("DELETE FROM movements WHERE account_id = ? AND period = ? AND type = 'FC'", [accountId, period]);

    return await dbRun(
        "INSERT INTO movements (account_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [accountId, "Fechamento de Conta", finalBalance, period, new Date().toISOString(), 'FC', 999]
    );
}
