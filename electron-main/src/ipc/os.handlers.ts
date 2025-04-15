import { ipcMain } from 'electron';
import { PLATFORM } from '../config';

export function registerOsHandlers(): void {
    console.log('Registering OS IPC Handlers...');

    // --- OS Info Handler ---
    ipcMain.handle('get-os-platform', (): string => {
        console.log('IPC: Handling get-os-platform');
        return PLATFORM;
    });
} 