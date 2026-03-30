// @ts-nocheck
import {  dbRun, dbAll  } from '../../services/mobile-sqlite.service';

export async function recategorizeMovements() {
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
}
