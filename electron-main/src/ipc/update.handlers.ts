import {ipcMain} from "electron";
import {checkForUpdates, quitAndInstallUpdate} from "../update-manager";

export function registerUpdateHandlers(): void {
    console.log('Registering Update IPC Handlers...');

    // --- Updater Handlers ---
    ipcMain.on('updater:check', () => {
        console.log('IPC: Handling updater:check');
        checkForUpdates();
    });

    ipcMain.on('updater:install', () => {
        console.log('IPC: Handling updater:install');
        quitAndInstallUpdate();
    });
}
