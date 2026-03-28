import electron from "electron";
const { ipcMain } = electron;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function handleIpc(channel, handler) {
    console.log(`[IPC] Registering handler: ${channel}`);
    ipcMain.handle(channel, async (event, ...args) => {
        try {
            return await handler(event, ...args);
        } catch (error) {
            console.error(`[IPC Error] ${channel}:`, error);
            throw error;
        }
    });
}

export async function setupAPI() {
    console.log("Registering IPC handlers...");

    const dbPath = path.join(__dirname, "db");
    
    if (!fs.existsSync(dbPath)) {
        console.warn("[API] db directory not found. No handlers registered.");
        return;
    }

    const folders = fs.readdirSync(dbPath);

    for (const folder of folders) {
        const folderPath = path.join(dbPath, folder);
        
        if (fs.statSync(folderPath).isDirectory()) {
            // Using relative path for dynamic import in ES modules
            const indexPath = `./db/${folder}/index.js`;
            
            try {
                // Prepend file:// protocol for absolute paths if needed, but relative usually works
                const module = await import(indexPath);
                const handlers = module.default;

                if (handlers && typeof handlers === 'object') {
                    Object.entries(handlers).forEach(([channel, handler]) => {
                        handleIpc(channel, handler);
                    });
                }
            } catch (error) {
                console.error(`[API] Error loading module ${folder}:`, error);
            }
        }
    }
}