import fs from 'fs';
import path from 'path';
import { dbGet, dbPath } from './database.services.js';
import { backupService } from './backup.services.js';

/**
 * Service to handle database recovery.
 */
export const recoveryService = {
    /**
     * Checks if the database is responding correctly.
     */
    async checkDatabaseHealth() {
        try {
            const result = await dbGet("SELECT 1");
            return !!result;
        } catch (error) {
            console.error(`Database health check failed: ${error.message}`);
            return false;
        }
    },

    /**
     * Initializes the recovery process if the database is corrupted.
     */
    async initRecovery() {
        console.log('Performing database health check...');
        const isHealthy = await this.checkDatabaseHealth();

        if (isHealthy) {
            console.log('Database is healthy.');
            return true;
        }

        console.error('CRITICAL: Database corruption detected. Starting automatic recovery...');

        try {
            const settings = await backupService.getSettings();
            const backupPath = settings.backup_path;

            if (!backupPath || !fs.existsSync(backupPath)) {
                logError('Automatic recovery failed: No valid backup path configured.');
                return false;
            }

            const files = fs.readdirSync(backupPath)
                .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
                .sort()
                .reverse(); // Latest first

            if (files.length === 0) {
                logError('Automatic recovery failed: No backup files found in configured folder.');
                return false;
            }

            const latestBackup = path.join(backupPath, files[0]);
            console.log(`Found latest backup at: ${latestBackup}. Reverting...`);

            // Replace current DB with the backup
            fs.copyFileSync(latestBackup, dbPath);

            console.log('Automatic recovery successful. Database restored from latest backup.');
            return true;
        } catch (error) {
            console.error(`Automatic recovery process failed: ${error.message}`);
            return false;
        }
    }
};
