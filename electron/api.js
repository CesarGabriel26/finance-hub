import { ipcMain } from "electron";
import { dbAll, dbRun, dbGet } from "./database.js";

export function setupAPI() {

    // -- IPC Handlers --
    ipcMain.handle("get-accounts", async () => {
        return await dbAll("SELECT * FROM accounts ORDER BY name");
    });

    ipcMain.handle("add-account", async (_, account) => {
        return await dbRun("INSERT INTO accounts (name, balance) VALUES (?, ?)", [account.name, account.balance || 0]);
    });

    ipcMain.handle("delete-account", async (_, id) => {
        return await dbRun("DELETE FROM accounts WHERE id = ?", [id]);
    });

    ipcMain.handle("update-account-balance", async (_, id, balance) => {
        return await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [balance, id]);
    });

    ipcMain.handle("get-categories", async () => {
        return await dbAll("SELECT * FROM categories ORDER BY name");
    });

    ipcMain.handle("add-category", async (_, category) => {
        return await dbRun("INSERT INTO categories (name, type) VALUES (?, ?)", [category.name, category.type]);
    });

    ipcMain.handle("delete-category", async (_, id) => {
        return await dbRun("DELETE FROM categories WHERE id = ?", [id]);
    });

    ipcMain.handle("get-movements", async (_, accountId, period) => {
        // Find if AC exists for this period
        let ac = await dbGet("SELECT * FROM movements WHERE account_id = ? AND period = ? AND type = 'AC'", [accountId, period]);
        if (!ac) {
            const account = await dbGet("SELECT * FROM accounts WHERE id = ?", [accountId]);
            const balance = account ? account.balance : 0;

            await dbRun(
                "INSERT INTO movements (account_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [accountId, "Abertura de Conta", balance, period, new Date().toISOString(), 'AC', 1]
            );
        }

        return await dbAll(`
            SELECT m.*, c.name as category_name
            FROM movements m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE m.account_id = ? AND m.period = ? 
            ORDER BY m.order_index ASC, m.date ASC
        `, [accountId, period]);
    });

    ipcMain.handle("add-movement", async (_, movement) => {
        let { 
            account_id, category_id, description, amount, period, date, type, 
            classification_source, classification_rule_id, confidence 
        } = movement;

        const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [account_id]);
        if (account) {
            const newBalance = type === 'expense' ? account.balance - amount : account.balance + amount;
            await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, account_id]);
        }

        const result = await dbRun(
            "INSERT INTO movements (account_id, category_id, description, amount, period, date, type, order_index, classification_source, classification_rule_id, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [account_id, category_id || null, description, amount, period, date, type, 2, classification_source || null, classification_rule_id || null, confidence || null]
        );

        return result;
    });

    ipcMain.handle("update-movement", async (_, id, movement) => {
        const { category_id, description, amount, date, type, classification_source, classification_rule_id, confidence } = movement;
        
        const oldMov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
        if (!oldMov) throw new Error("Movement not found");

        if (amount !== undefined && amount !== oldMov.amount) {
            const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [oldMov.account_id]);
            if (account) {
                // Revert old
                let bal = oldMov.type === 'expense' ? account.balance + oldMov.amount : account.balance - oldMov.amount;
                // Apply new
                const nextAmount = amount !== undefined ? amount : oldMov.amount;
                const nextType = type !== undefined ? type : oldMov.type;
                bal = nextType === 'expense' ? bal - nextAmount : bal + nextAmount;
                await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [bal, oldMov.account_id]);
            }
        }

        await dbRun(
            `UPDATE movements SET 
                category_id = ?, description = ?, amount = ?, date = ?, type = ?, 
                classification_source = ?, classification_rule_id = ?, confidence = ?
            WHERE id = ?`,
            [
                category_id !== undefined ? category_id : oldMov.category_id,
                description !== undefined ? description : oldMov.description,
                amount !== undefined ? amount : oldMov.amount,
                date !== undefined ? date : oldMov.date,
                type !== undefined ? type : oldMov.type,
                classification_source || oldMov.classification_source,
                classification_rule_id || oldMov.classification_rule_id,
                confidence !== undefined ? confidence : oldMov.confidence,
                id
            ]
        );

        return { success: true };
    });

    ipcMain.handle("delete-movement", async (_, id) => {
        const mov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
        if (!mov) return { success: false };

        if (mov.type === 'revenue' || mov.type === 'expense') {
            const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [mov.account_id]);
            if (account) {
                const newBalance = mov.type === 'expense' ? account.balance + mov.amount : account.balance - mov.amount;
                await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, mov.account_id]);
            }
        }

        return await dbRun("DELETE FROM movements WHERE id = ?", [id]);
    });

    ipcMain.handle("get-movements-for-review", async () => {
        return await dbAll(`
            SELECT m.*, c.name as category_name, acc.name as account_name
            FROM movements m
            LEFT JOIN categories c ON m.category_id = c.id
            JOIN accounts acc ON m.account_id = acc.id
            WHERE m.category_id IS NULL 
               OR m.confidence < 0.6 
            ORDER BY m.date DESC
            LIMIT 100
        `);
    });

    ipcMain.handle("close-period", async (_, accountId, period) => {
        const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [accountId]);
        const balance = account ? account.balance : 0;

        await dbRun("DELETE FROM movements WHERE account_id = ? AND period = ? AND type = 'FC'", [accountId, period]);

        return await dbRun(
            "INSERT INTO movements (account_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [accountId, "Fechamento de Conta", balance, period, new Date().toISOString(), 'FC', 999]
        );
    });

    // -- Keywords Handlers --
    ipcMain.handle("get-keywords", async () => {
        return await dbAll(`
            SELECT k.*, c.name as category_name, c.type as category_type
            FROM keywords k 
            JOIN categories c ON k.category_id = c.id 
            ORDER BY k.keyword
        `);
    });

    ipcMain.handle("add-keyword", async (_, keyword, category_id) => {
        return await dbRun(
            "INSERT INTO keywords (keyword, category_id) VALUES (?, ?)", 
            [keyword, category_id]
        );
    });

    ipcMain.handle("delete-keyword", async (_, id) => {
        return await dbRun("DELETE FROM keywords WHERE id = ?", [id]);
    });

    // -- Bills Handlers (Contas a Pagar/Receber) --
    ipcMain.handle("get-bills", async (_, type, status = 'pending') => {
        let query = `
            SELECT b.*, c.name as category_name 
            FROM bills b 
            LEFT JOIN categories c ON b.category_id = c.id 
            WHERE b.status = ?
        `;
        let params = [status];
        if (type) {
            query += " AND b.type = ?";
            params.push(type);
        }
        query += " ORDER BY b.due_date ASC";
        return await dbAll(query, params);
    });

    ipcMain.handle("add-bill", async (_, bill) => {
        const { description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment } = bill;
        return await dbRun(
            "INSERT INTO bills (description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [description, amount, due_date, type, category_id, is_recurring ? 1 : 0, total_installments || 1, current_installment || 1]
        );
    });

    ipcMain.handle("delete-bill", async (_, id) => {
        return await dbRun("DELETE FROM bills WHERE id = ?", [id]);
    });

    ipcMain.handle("pay-bill", async (_, { billId, accountId, paymentDate }) => {
        const bill = await dbGet("SELECT * FROM bills WHERE id = ?", [billId]);
        if (!bill) throw new Error("Bill not found");

        // 1. Mark current bill as paid
        await dbRun("UPDATE bills SET status = 'paid' WHERE id = ?", [billId]);

        // 2. Add movement to account
        const period = paymentDate.substring(0, 7);
        
        const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [accountId]);
        if (account) {
            const newBalance = bill.type === 'D' ? account.balance - bill.amount : account.balance + bill.amount;
            await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, accountId]);
        }

        await dbRun(
            "INSERT INTO movements (account_id, category_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [accountId, bill.category_id, bill.description, (bill.type === 'D' ? -bill.amount : bill.amount), period, paymentDate, bill.type, 2]
        );

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
    });



    // -- Keyword Rules Handlers --
    ipcMain.handle("get-keyword-rules", async () => {
        return await dbAll(`
            SELECT kr.*, c.name as category_name
            FROM keyword_rules kr
            JOIN categories c ON kr.category_id = c.id
            ORDER BY kr.priority DESC, kr.keyword ASC
        `);
    });

    ipcMain.handle("add-keyword-rule", async (_, rule) => {
        const { keyword, category_id, priority, created_by_user } = rule;
        return await dbRun(
            "INSERT INTO keyword_rules (keyword, category_id, priority, created_by_user) VALUES (?, ?, ?, ?)",
            [keyword, category_id, priority || 0, created_by_user ? 1 : 0]
        );
    });

    ipcMain.handle("delete-keyword-rule", async (_, id) => {
        return await dbRun("DELETE FROM keyword_rules WHERE id = ?", [id]);
    });

    // -- Investments Handlers --
    ipcMain.handle("get-assets", async () => {
        return await dbAll(`
            SELECT a.*, 
                   COALESCE(SUM(CASE WHEN ie.type = 'deposit' THEN ie.amount ELSE -ie.amount END), 0) as total_invested
            FROM assets a
            LEFT JOIN investment_entries ie ON a.id = ie.asset_id
            GROUP BY a.id
            ORDER BY a.name
        `);
    });

    ipcMain.handle("add-asset", async (_, asset) => {
        const { name, type, objective_value } = asset;
        return await dbRun(
            "INSERT INTO assets (name, type, objective_value) VALUES (?, ?, ?)",
            [name, type, objective_value]
        );
    });

    ipcMain.handle("delete-asset", async (_, id) => {
        await dbRun("DELETE FROM investment_entries WHERE asset_id = ?", [id]);
        return await dbRun("DELETE FROM assets WHERE id = ?", [id]);
    });

    ipcMain.handle("get-investment-entries", async (_, assetId) => {
        return await dbAll(`
            SELECT ie.*, acc.name as account_name
            FROM investment_entries ie
            JOIN accounts acc ON ie.account_id = acc.id
            WHERE ie.asset_id = ?
            ORDER BY ie.date DESC
        `, [assetId]);
    });

    ipcMain.handle("add-investment-entry", async (_, entry) => {
        const { account_id, asset_id, type, amount, date, description } = entry;
        
        // Update account balance
        const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [account_id]);
        if (account) {
            const newBalance = type === 'deposit' ? account.balance - amount : account.balance + amount;
            await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, account_id]);
        }

        return await dbRun(
            "INSERT INTO investment_entries (account_id, asset_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)",
            [account_id, asset_id, type, amount, date, description]
        );
    });

    ipcMain.handle("delete-investment-entry", async (_, id) => {
        const entry = await dbGet("SELECT * FROM investment_entries WHERE id = ?", [id]);
        if (!entry) return { success: false };

        // Revert account balance
        const account = await dbGet("SELECT balance FROM accounts WHERE id = ?", [entry.account_id]);
        if (account) {
            const newBalance = entry.type === 'deposit' ? account.balance + entry.amount : account.balance - entry.amount;
            await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [newBalance, entry.account_id]);
        }

        return await dbRun("DELETE FROM investment_entries WHERE id = ?", [id]);
    });

    // -- Settings Handlers --
    ipcMain.handle("get-settings", async () => {
        const rows = await dbAll("SELECT * FROM settings");
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        });
        return settings;
    });

    ipcMain.handle("update-setting", async (_, key, value) => {
        const strValue = typeof value === 'boolean' ? String(value) : value;
        return await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, strValue]);
    });

    ipcMain.handle("check-due-bills", async () => {
        const today = new Date();
        const nextThreeDays = new Date();
        nextThreeDays.setDate(today.getDate() + 3);
        
        const todayStr = today.toISOString().split('T')[0];
        const nextThreeDaysStr = nextThreeDays.toISOString().split('T')[0];

        return await dbAll(`
            SELECT b.*, c.name as category_name
            FROM bills b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.status = 'pending' AND b.due_date <= ? AND b.due_date >= ?
            ORDER BY b.due_date ASC
        `, [nextThreeDaysStr, todayStr]);
    });
}