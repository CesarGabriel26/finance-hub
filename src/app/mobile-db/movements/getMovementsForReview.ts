// @ts-nocheck
import {  dbAll  } from '../../services/mobile-sqlite.service';

export async function getMovementsForReview() {
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
}
