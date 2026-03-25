import fs from 'fs';
import path from 'path';
import { dbPath, dbGet, dbRun } from '../database.js';
import { logInfo, logError } from './logger.js';

/**
 * Service to handle database backups.
 */
export const backupService = {
    /**
     * Gets backup settings from the database.
     */
    async getSettings() {
        try {
            const pathRow = await dbGet("SELECT value FROM settings WHERE key = 'backup_paths'");
            const freqRow = await dbGet("SELECT value FROM settings WHERE key = 'backup_frequency'");
            
            let backup_paths = [];
            try {
                backup_paths = pathRow ? JSON.parse(pathRow.value) : [];
                if (!Array.isArray(backup_paths)) {
                    // Migration: if it was a single string, wrap it
                    backup_paths = pathRow.value ? [pathRow.value] : [];
                }
            } catch (e) {
                // Not JSON, assume literal string (migration)
                backup_paths = pathRow && pathRow.value ? [pathRow.value] : [];
            }

            return {
                backup_paths: backup_paths,
                backup_frequency: freqRow ? freqRow.value : 'daily'
            };
        } catch (error) {
            logError(`Failed to get backup settings: ${error.message}`);
            return { backup_paths: [], backup_frequency: 'daily' };
        }
    },

    /**
     * Saves backup settings to the database.
     */
    async setSettings(settings) {
        try {
            if (settings.backup_paths) {
                await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('backup_paths', ?)", [JSON.stringify(settings.backup_paths)]);
            }
            if (settings.backup_frequency) {
                await dbRun("INSERT OR REPLACE INTO settings (key, value) VALUES ('backup_frequency', ?)", [settings.backup_frequency]);
            }
            logInfo(`Backup settings updated: ${JSON.stringify(settings)}`);
            return { success: true };
        } catch (error) {
            logError(`Failed to set backup settings: ${error.message}`);
            return { success: false, error: error.message };
        }
    },

    /**
     * Performs a manual or automatic backup.
     */
    async performBackup() {
        try {
            const settings = await this.getSettings();
            const backupPaths = settings.backup_paths;

            if (!backupPaths || backupPaths.length === 0) {
                logInfo('Backup skipped: No backup paths configured.');
                return { success: false, error: 'No backup paths configured' };
            }

            const results = [];
            const date = new Date().toISOString().split('T')[0];
            const backupFileName = `backup-${date}.db`;

            for (const backupPath of backupPaths) {
                try {
                    if (!backupPath || backupPath.trim() === '') continue;

                    // Ensure backup directory exists
                    if (!fs.existsSync(backupPath)) {
                        fs.mkdirSync(backupPath, { recursive: true });
                    }

                    const destination = path.join(backupPath, backupFileName);
                    fs.copyFileSync(dbPath, destination);
                    
                    await this.cleanupOldBackups(backupPath);
                    results.push({ path: backupPath, success: true });
                    logInfo(`Backup created successfully at: ${destination}`);
                } catch (err) {
                    logError(`Backup failed for path ${backupPath}: ${err.message}`);
                    results.push({ path: backupPath, success: false, error: err.message });
                }
            }
            
            const anySuccess = results.some(r => r.success);
            return { 
                success: anySuccess, 
                results: results 
            };
        } catch (error) {
            logError(`Backup failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    },

    /**
     * Keeps only the last 7 backups in the specified folder.
     */
    async cleanupOldBackups(backupPath) {
        try {
            const files = fs.readdirSync(backupPath)
                .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
                .sort(); // Sorts by date because of YYYY-MM-DD format

            if (files.length > 7) {
                const toDelete = files.slice(0, files.length - 7);
                for (const file of toDelete) {
                    fs.unlinkSync(path.join(backupPath, file));
                    logInfo(`Old backup deleted: ${file}`);
                }
            }
        } catch (error) {
            logError(`Cleanup of old backups failed: ${error.message}`);
        }
    },

    /**
     * Sets up the automatic backup schedule.
     */
    setupAutoBackup() {
        // Run daily (every 24 hours)
        setInterval(async () => {
            const settings = await this.getSettings();
            if (settings.backup_frequency === 'daily') {
                logInfo('Starting scheduled daily backup...');
                await this.performBackup();
            }
        }, 24 * 60 * 60 * 1000);
        
        // Also try a backup shortly after startup if it's daily
        setTimeout(async () => {
            const settings = await this.getSettings();
            if (settings.backup_frequency === 'daily') {
                const date = new Date().toISOString().split('T')[0];
                const backupPaths = settings.backup_paths;
                
                let needed = false;
                for (const bp of backupPaths) {
                    const expectedFile = path.join(bp, `backup-${date}.db`);
                    if (!fs.existsSync(expectedFile)) {
                        needed = true;
                        break;
                    }
                }

                if (needed) {
                    logInfo('Missing today\'s backup in at least one folder, performing scheduled backup...');
                    await this.performBackup();
                }
            }
        }, 30000); // 30 seconds after startup
    }
};
