import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/**
 * Ensures the log directory exists.
 */
const getLogDirectory = () => {
    const logDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    return logDir;
};

/**
 * Generates the log file path based on type and current date.
 * @param {string} type - 'app' or 'error'
 */
const getLogFile = (type = 'app') => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(getLogDirectory(), `${type}-${date}.log`);
};

/**
 * Writes a message to the corresponding log file.
 * @param {string} type - 'info' or 'error'
 * @param {string} message - The message to log
 */
const writeLog = (type, message) => {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    const logFile = getLogFile(type === 'error' ? 'error' : 'app');
    
    try {
        fs.appendFileSync(logFile, logMessage);
        // Also log errors to the main app log for context
        if (type === 'error') {
            fs.appendFileSync(getLogFile('app'), logMessage);
        }
        console.log(logMessage.trim());
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
};

export const logInfo = (message) => writeLog('info', message);
export const logError = (message) => writeLog('error', message);