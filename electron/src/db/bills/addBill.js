import { dbRun } from "../../services/database.services.js";

export async function addBill(_, bill) {
    const { description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment } = bill;
    return await dbRun(
        "INSERT INTO bills (description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [description, amount, due_date, type, category_id, is_recurring ? 1 : 0, total_installments || 1, current_installment || 1]
    );
}
