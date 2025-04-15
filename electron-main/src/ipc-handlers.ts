import {ipcMain, IpcMainEvent} from "electron";
import {registerAliasHandlers, registerOsHandlers, registerSettingsHandlers, registerUpdateHandlers} from "./ipc";

export function registerAllIpcHandlers(): void {
    console.log('Registering IPC Handlers...');

    // --- Basic Test Handler ---
    ipcMain.on('send-message-to-main', (event: IpcMainEvent, arg: string) => {
        console.log('IPC: Received message:', arg);
        event.reply('message-from-main', `Main process received: "${arg}" at ${new Date()}`);
    });

    registerOsHandlers();
    registerAliasHandlers();
    registerSettingsHandlers();

    registerUpdateHandlers();

    console.log('IPC Handlers Registered.');
}
