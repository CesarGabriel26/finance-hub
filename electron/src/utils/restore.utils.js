import fs from 'fs';
import path from 'path';
import { dbPath, closeDatabase } from '../services/database.services.js';
import { logInfo, logError } from './logger.utils.js';
import electron from 'electron';
const { app } = electron;

/**
 * Safely restores a database from a backup file.
 * @param {string} backupFilePath - Full path to the backup .db file
 */
export const restoreFromBackup = async (backupFilePath) => {
    try {
        if (!fs.existsSync(backupFilePath)) {
            logError(`Restore failed: File not found at ${backupFilePath}`);
            return { success: false, error: 'Backup file not found' };
        }

        logInfo(`Initiating restore from backup: ${backupFilePath}`);

        // 1. Close current connection
        await closeDatabase();
        logInfo('Database connection closed for restore.');

        // 2. Backup current (corrupted?) file just in case
        const currentBackupTemp = `${dbPath}.old-before-restore`;
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, currentBackupTemp);
            logInfo('Created temporary backup of current database file.');
        }

        // 3. Replace current DB with backup
        fs.copyFileSync(backupFilePath, dbPath);
        logInfo('Database file replaced with backup.');

        // 4. Cleanup temp backup
        if (fs.existsSync(currentBackupTemp)) {
            fs.unlinkSync(currentBackupTemp);
        }

        logInfo('Restore complete. Relaunching application...');
        
        // 5. Relaunch to reinitialize everything safely
        app.relaunch();
        app.exit(0);

        return { success: true };
    } catch (error) {
        logError(`Restore from backup failed: ${error.message}`);
        return { success: false, error: error.message };
    }
};