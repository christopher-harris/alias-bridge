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

    // // --- OS Info Handler ---
    // ipcMain.handle('get-os-platform', (): string => {
    //     console.log('IPC: Handling get-os-platform');
    //     return PLATFORM;
    // });

    registerUpdateHandlers();

    console.log('IPC Handlers Registered.');
}






// import {ipcMain, IpcMainEvent} from "electron";
// import {PLATFORM} from "./config";
// import {registerAliasHandlers, registerSettingsHandlers, registerUpdateHandlers} from "./ipc";
//
// /**
//  * Registers all IPC handlers for the application by calling
//  * registration functions from feature-specific modules.
//  */
// export function registerAllIpcHandlers(): void {
//     console.log('Registering IPC Handlers...');
//
//     // --- Basic Test Handler ---
//     ipcMain.on('send-message-to-main', (event: IpcMainEvent, arg: string) => {
//         console.log('IPC: Received message:', arg);
//         event.reply('message-from-main', `Main process received: "${arg}" at ${new Date()}`);
//     });
//
//     // --- OS Info Handler ---
//     ipcMain.handle('get-os-platform', (): string => {
//         console.log('IPC: Handling get-os-platform');
//         return PLATFORM;
//     });
//
//     registerAliasHandlers();
//     registerSettingsHandlers();
//     registerUpdateHandlers();
//
//     console.log('IPC Handlers Registered.');
// }
