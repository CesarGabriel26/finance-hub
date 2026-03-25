import fs from 'fs';
import path from 'path';
import { dbGet, dbPath } from '../database.js';
import { logInfo, logError } from './logger.js';
import { backupService } from './backupService.js';

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
            logError(`Database health check failed: ${error.message}`);
            return false;
        }
    },

    /**
     * Initializes the recovery process if the database is corrupted.
     */
    async initRecovery() {
        logInfo('Performing database health check...');
        const isHealthy = await this.checkDatabaseHealth();
        
        if (isHealthy) {
            logInfo('Database is healthy.');
            return true;
        }

        logError('CRITICAL: Database corruption detected. Starting automatic recovery...');
        
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
            logInfo(`Found latest backup at: ${latestBackup}. Reverting...`);

            // Replace current DB with the backup
            // Note: Since health check failed, the connection might be closed or unstable.
            // Ideally we should try to close it then copy.
            fs.copyFileSync(latestBackup, dbPath);
            
            logInfo('Automatic recovery successful. Database restored from latest backup.');
            return true;
        } catch (error) {
            logError(`Automatic recovery process failed: ${error.message}`);
            return false;
        }
    }
};
