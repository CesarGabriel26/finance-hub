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
 * @param {string} type - 'info', 'error', 'warn', etc.
 * @param {string} message - The message to log
 */
const writeLog = (type, message) => {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    const logFile = getLogFile(type === 'error' ? 'error' : 'app');
    
    try {
        fs.appendFileSync(logFile, logMessage);
        // Also log errors/warnings to the main app log for context
        if (type === 'error' || type === 'warn') {
            fs.appendFileSync(getLogFile('app'), logMessage);
        }
        // In dev, we still want to see it in the console terminal
        // But we avoid recursion if we redirected console.log
    } catch (err) {
        // Fallback to original console to avoid losing the message
        process.stderr.write(`Failed to write to log file: ${err.message}\n`);
    }
};

/**
 * Redirects console.log, console.error, and console.warn to the app's log files.
 */
export const setupConsoleRedirection = () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
        originalLog(...args);
        writeLog('info', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    };

    console.error = (...args) => {
        originalError(...args);
        writeLog('error', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    };

    console.warn = (...args) => {
        originalWarn(...args);
        writeLog('warn', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    };
    
    logInfo("Console redirection initialized.");
};

export const logInfo = (message) => writeLog('info', message);
export const logError = (message) => writeLog('error', message);