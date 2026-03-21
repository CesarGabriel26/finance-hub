import { ipcMain } from "electron";
import { dbAll, dbRun, dbGet } from "./database.js";

function handleIpc(channel, handler) {
    ipcMain.handle(channel, async (event, ...args) => {
        try {
            return await handler(event, ...args);
        } catch (error) {
            console.error(`[IPC Error] ${channel}:`, error);
            throw error;
        }
    });
}


async function recalculateAccountBalance(accountId) {
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

export function setupAPI() {

    handleIpc("recalculate-balance", async (_, accountId) => {
        await recalculateAccountBalance(accountId);
        return { success: true };
    });

    // -- IPC Handlers --
    handleIpc("get-accounts", async () => {
        return await dbAll("SELECT * FROM accounts ORDER BY name");
    });

    handleIpc("add-account", async (_, account) => {
        return await dbRun("INSERT INTO accounts (name, balance) VALUES (?, ?)", [account.name, account.balance || 0]);
    });

    handleIpc("delete-account", async (_, id) => {
        return await dbRun("DELETE FROM accounts WHERE id = ?", [id]);
    });

    handleIpc("update-account-balance", async (_, id, balance) => {
        return await dbRun("UPDATE accounts SET balance = ? WHERE id = ?", [balance, id]);
    });

    handleIpc("update-account-name", async (_, id, name) => {
        return await dbRun("UPDATE accounts SET name = ? WHERE id = ?", [name, id]);
    });

    handleIpc("get-categories", async () => {
        return await dbAll("SELECT * FROM categories ORDER BY name");
    });

    handleIpc("add-category", async (_, category) => {
        return await dbRun("INSERT INTO categories (name, type) VALUES (?, ?)", [category.name, category.type]);
    });

    handleIpc("delete-category", async (_, id) => {
        return await dbRun("DELETE FROM categories WHERE id = ?", [id]);
    });

    handleIpc("get-movements", async (_, accountId, period) => {
        return await dbAll(`
            SELECT m.*, c.name as category_name
            FROM movements m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE m.account_id = ? AND m.period = ? 
            ORDER BY m.order_index ASC, m.date ASC
        `, [accountId, period]);
    });

    handleIpc("add-movement", async (_, movement, skipRecalculation = false) => {
        let { 
            account_id, category_id, description, amount, period, date, type, 
            order_index, classification_source, classification_rule_id, confidence 
        } = movement;

        if (type === 'AC') {
            const existingAC = await dbGet("SELECT id FROM movements WHERE account_id = ? AND period = ? AND type = 'AC'", [account_id, period]);
            if (existingAC) {
                // update existing instead of inserting
                await dbRun("UPDATE movements SET amount = ?, date = ?, description = ? WHERE id = ?", [amount, date, description, existingAC.id]);
                if (!skipRecalculation) await recalculateAccountBalance(account_id);
                return { id: existingAC.id, updated: true };
            }
        }

        // STRICT Duplicate Detection for all movements
        const normDesc = (description || "").trim().toUpperCase();
        const normAmount = Math.round(amount * 100) / 100;
        const normDate = date.substring(0, 10);

        const existingMatch = await dbGet(`
            SELECT id FROM movements 
            WHERE account_id = ? AND SUBSTR(date, 1, 10) = ? 
            AND ROUND(amount, 2) = ? AND UPPER(TRIM(description)) = ?
        `, [account_id, normDate, normAmount, normDesc]);

        if (existingMatch) {
            return { id: existingMatch.id, skipped: true };
        }

        const result = await dbRun(
            "INSERT INTO movements (account_id, category_id, description, amount, period, date, type, order_index, classification_source, classification_rule_id, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [account_id, category_id || null, description, amount, period, date, type, order_index !== undefined ? order_index : 2, classification_source || null, classification_rule_id || null, confidence || null]
        );

        if (!skipRecalculation) {
            await recalculateAccountBalance(account_id);
        }

        return result;
    });

    handleIpc("update-movement", async (_, id, movement, skipRecalculation = false) => {
        const { category_id, description, amount, date, type, classification_source, classification_rule_id, confidence } = movement;
        
        const oldMov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
        if (!oldMov) throw new Error("Movement not found");

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

        if (!skipRecalculation) {
            await recalculateAccountBalance(oldMov.account_id);
        }

        return { success: true };
    });

    handleIpc("delete-movement", async (_, id, skipRecalculation = false) => {
        const mov = await dbGet("SELECT * FROM movements WHERE id = ?", [id]);
        if (!mov) return { success: false };

        await dbRun("DELETE FROM movements WHERE id = ?", [id]);

        if (!skipRecalculation) {
            await recalculateAccountBalance(mov.account_id);
        }

        return { success: true };
    });

    handleIpc("get-movements-for-review", async () => {
        return await dbAll(`
            SELECT m.*, c.name as category_name, acc.name as account_name
            FROM movements m
            LEFT JOIN categories c ON m.category_id = c.id
            JOIN accounts acc ON m.account_id = acc.id
            WHERE (m.category_id IS NULL OR m.confidence < 0.6)
              AND m.type NOT IN ('AC', 'FC')
            ORDER BY m.date DESC
            LIMIT 100
        `);
    });

    handleIpc("close-period", async (_, accountId, period) => {
        // Calculate balance: AC + sum(Credit) - sum(Debit)
        const ac = await dbGet("SELECT amount FROM movements WHERE account_id = ? AND period = ? AND type = 'AC'", [accountId, period]);
        const startBalance = ac ? ac.amount : 0;

        const movements = await dbAll("SELECT amount, type FROM movements WHERE account_id = ? AND period = ? AND type NOT IN ('AC', 'FC')", [accountId, period]);
        const totalMovements = movements.reduce((acc, m) => {
            // In the DB, revenues have type 'C' or 'AC', expenses have type 'D' or 'FC'?
            // Wait, standard movements are 'C' (Revenue) and 'D' (Expense).
            return acc + (m.type === 'C' ? m.amount : -m.amount);
        }, 0);

        const finalBalance = startBalance + totalMovements;

        await dbRun("DELETE FROM movements WHERE account_id = ? AND period = ? AND type = 'FC'", [accountId, period]);

        return await dbRun(
            "INSERT INTO movements (account_id, description, amount, period, date, type, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [accountId, "Fechamento de Conta", finalBalance, period, new Date().toISOString(), 'FC', 999]
        );
    });

    // -- Keywords Handlers --
    handleIpc("get-keywords", async () => {
        return await dbAll(`
            SELECT k.*, c.name as category_name, c.type as category_type
            FROM keywords k 
            JOIN categories c ON k.category_id = c.id 
            ORDER BY k.keyword
        `);
    });

    handleIpc("add-keyword", async (_, keyword, category_id) => {
        return await dbRun(
            "INSERT INTO keywords (keyword, category_id) VALUES (?, ?)", 
            [keyword, category_id]
        );
    });

    handleIpc("delete-keyword", async (_, id) => {
        return await dbRun("DELETE FROM keywords WHERE id = ?", [id]);
    });

    // -- Bills Handlers (Contas a Pagar/Receber) --
    handleIpc("get-bills", async (_, type, status = 'pending') => {
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

    handleIpc("add-bill", async (_, bill) => {
        const { description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment } = bill;
        return await dbRun(
            "INSERT INTO bills (description, amount, due_date, type, category_id, is_recurring, total_installments, current_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [description, amount, due_date, type, category_id, is_recurring ? 1 : 0, total_installments || 1, current_installment || 1]
        );
    });

    handleIpc("delete-bill", async (_, id) => {
        return await dbRun("DELETE FROM bills WHERE id = ?", [id]);
    });

    handleIpc("pay-bill", async (_, { billId, accountId, paymentDate }) => {
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
    });



    // -- Keyword Rules Handlers --
    handleIpc("get-keyword-rules", async () => {
        return await dbAll(`
            SELECT kr.*, c.name as category_name
            FROM keyword_rules kr
            JOIN categories c ON kr.category_id = c.id
            ORDER BY kr.priority DESC, kr.keyword ASC
        `);
    });

    handleIpc("add-keyword-rule", async (_, rule) => {
        const { keyword, category_id, priority, created_by_user } = rule;
        return await dbRun(
            "INSERT INTO keyword_rules (keyword, category_id, priority, created_by_user) VALUES (?, ?, ?, ?)",
            [keyword, category_id, priority || 0, created_by_user ? 1 : 0]
        );
    });

    handleIpc("delete-keyword-rule", async (_, id) => {
        return await dbRun("DELETE FROM keyword_rules WHERE id = ?", [id]);
    });

    // -- Investments Handlers --
    handleIpc("get-assets", async () => {
        return await dbAll(`
            SELECT a.*, 
                   COALESCE(SUM(CASE WHEN ie.type = 'deposit' THEN ie.amount ELSE -ie.amount END), 0) as total_invested
            FROM assets a
            LEFT JOIN investment_entries ie ON a.id = ie.asset_id
            GROUP BY a.id
            ORDER BY a.name
        `);
    });

    handleIpc("add-asset", async (_, asset) => {
        const { name, type, objective_value } = asset;
        return await dbRun(
            "INSERT INTO assets (name, type, objective_value) VALUES (?, ?, ?)",
            [name, type, objective_value]
        );
    });

    handleIpc("delete-asset", async (_, id) => {
        await dbRun("DELETE FROM investment_entries WHERE asset_id = ?", [id]);
        return await dbRun("DELETE FROM assets WHERE id = ?", [id]);
    });

    handleIpc("get-investment-entries", async (_, assetId) => {
        return await dbAll(`
            SELECT ie.*, acc.name as account_name
            FROM investment_entries ie
            JOIN accounts acc ON ie.account_id = acc.id
            WHERE ie.asset_id = ?
            ORDER BY ie.date DESC
        `, [assetId]);
    });

    handleIpc("add-investment-entry", async (_, entry) => {
        const { account_id, asset_id, type, amount, date, description } = entry;
        
        const result = await dbRun(
            "INSERT INTO investment_entries (account_id, asset_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)",
            [account_id, asset_id, type, amount, date, description]
        );

        await recalculateAccountBalance(account_id);

        return result;
    });

    handleIpc("delete-investment-entry", async (_, id) => {
        const entry = await dbGet("SELECT * FROM investment_entries WHERE id = ?", [id]);
        if (!entry) return { success: false };

        await dbRun("DELETE FROM investment_entries WHERE id = ?", [id]);
        await recalculateAccountBalance(entry.account_id);

        return { success: true };
    });

    // -- Settings Handlers --
    handleIpc("get-settings", async () => {
        const rows = await dbAll("SELECT * FROM settings");
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        });
        return settings;
    });

    handleIpc("update-setting", async (_, key, value) => {
        const strValue = typeof value === 'boolean' ? String(value) : value;
        return await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, strValue]);
    });

    handleIpc("check-due-bills", async () => {
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

    handleIpc("recategorize-movements", async () => {
        const rules = await dbAll("SELECT * FROM keyword_rules ORDER BY priority DESC");
        const legacyKeywords = await dbAll("SELECT * FROM keywords");
        const movements = await dbAll("SELECT * FROM movements WHERE (category_id IS NULL OR confidence < 0.9) AND type NOT IN ('AC', 'FC')");

        let updatedCount = 0;
        for (const mov of movements) {
            const desc = mov.description.toUpperCase();
            
            // Try Rules first (Priority)
            let match = rules.find(r => desc.includes(r.keyword.toUpperCase()));
            let confidence = 0.9;
            let ruleId = match ? match.id : null;

            // Fallback to legacy
            if (!match) {
                const legacyMatch = legacyKeywords.find(k => desc.includes(k.keyword.toUpperCase()));
                if (legacyMatch) {
                    match = legacyMatch;
                    confidence = 0.7;
                }
            }
            
            if (match && match.category_id !== mov.category_id) {
                await dbRun(
                    "UPDATE movements SET category_id = ?, classification_source = 'keyword', classification_rule_id = ?, confidence = ? WHERE id = ?",
                    [match.category_id, ruleId, confidence, mov.id]
                );
                updatedCount++;
            }
        }
        return { updatedCount };
    });

    handleIpc("get-dashboard-data", async (_, period) => {
        return await dbAll(`
            SELECT m.type, m.category_id, c.name as category_name, SUM(ABS(m.amount)) as total
            FROM movements m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE m.period = ? AND m.type IN ('C', 'D')
            GROUP BY m.type, m.category_id, c.name
        `, [period]);
    });

    handleIpc("get-dashboard-evolution", async (_, periods) => {
        const placeholders = periods.map(() => '?').join(',');
        return await dbAll(`
            SELECT 
                period, 
                SUM(CASE WHEN type = 'D' THEN ABS(amount) ELSE 0 END) as total_expense,
                SUM(CASE WHEN type = 'C' THEN ABS(amount) ELSE 0 END) as total_revenue
            FROM movements
            WHERE period IN (${placeholders}) AND type IN ('C', 'D')
            GROUP BY period
        `, periods);
    });
}