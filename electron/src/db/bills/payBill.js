import { dbRun, dbGet } from "../../services/database.services.js";
import { recalculateAccountBalance } from "../accounts/recalculateAccountBalance.js";

export async function payBill(_, { billId, accountId, paymentDate }) {
    const bill = await dbGet("SELECT * FROM bills WHERE id = ?", [billId]);
    if (!bill) throw new Error("Bill not found");

    // 1. Mark current bill as paid
    await dbRun("UPDATE bills SET status = 'paid' WHERE id = ?", [billId]);

    // 2. Add movement to account
    const period = paymentDate.substring(0, 7);

    await dbRun(
        "INSERT INTO movements (account_id, category_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [accountId, bill.category_id, bill.description, bill.amount, period, paymentDate, bill.type, 2]
    );

    await recalculateAccountBalance(accountId);

    // 3. Handle recurring/installments
    if (bill.is_recurring) {
        const d = new Date(bill.due_date + 'T12:00:00');
        d.setMonth(d.getMonth() + 1);
        const nextDate = d.toISOString().split('T')[0];
        await dbRun(
            "INSERT INTO bills (description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [bill.description, bill.amount, nextDate, bill.type, bill.category_id, 1, 1, 1]
        );
    } else if (bill.total_installments > 1 && bill.current_installment < bill.total_installments) {
        const d = new Date(bill.due_date + 'T12:00:00');
        d.setMonth(d.getMonth() + 1);
        const nextDate = d.toISOString().split('T')[0];
        await dbRun(
            "INSERT INTO bills (description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [bill.description, bill.amount, nextDate, bill.type, bill.category_id, 0, bill.total_installments, bill.current_installment + 1]
        );
    }

    return { success: true };
}
