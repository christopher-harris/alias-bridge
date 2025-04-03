import {ipcMain, IpcMainEvent, IpcMainInvokeEvent} from "electron";
import {PLATFORM} from "./config";
import {Alias} from "./types";
import {readAliasData, saveAliasData} from "./data-store";
import {regenerateAliasShellFile} from "./shell-generator";

export function registerIpcHandlers(): void {
    console.log('Registering IPC Handlers...');

    // --- Basic Test Handler ---
    ipcMain.on('send-message-to-main', (event: IpcMainEvent, arg: string) => {
        console.log('IPC: Received message:', arg);
        event.reply('message-from-main', `Main process received: "${arg}" at ${new Date()}`);
    });

    // --- OS Info Handler ---
    ipcMain.handle('get-os-platform', (): string => {
        console.log('IPC: Handling get-os-platform');
        return PLATFORM;
    });

    // --- Alias Handlers ---
    ipcMain.handle('get-aliases', async (event: IpcMainInvokeEvent): Promise<Alias[]> => {
        console.log('IPC: Handling get-aliases');
        try {
            return await readAliasData();
        } catch (error) {
            console.error("Error handling get-aliases:", error);
            return []; // Return empty array on error
        }
    });

    ipcMain.on('add-alias', async (event: IpcMainEvent, alias: Alias) => {
        console.log('IPC: Handling add-alias:', alias);
        let currentAliases: Alias[] = [];
        try {
            currentAliases = await readAliasData();
            const existingIndex = currentAliases.findIndex(a => a.name === alias.name);

            if (existingIndex !== -1) {
                console.log(`Overwriting existing alias: ${alias.name}`);
                currentAliases[existingIndex] = alias;
            } else {
                currentAliases.push(alias);
            }

            await saveAliasData(currentAliases);
            await regenerateAliasShellFile(currentAliases); // Regenerate after successful save

            console.log(`Alias ${alias.name} processed successfully.`);
            event.reply('add-alias-reply', {success: true, name: alias.name});

        } catch (error: any) {
            console.error("Error processing add-alias:", error);
            event.reply('add-alias-reply', {success: false, name: alias.name, error: error.message});
        }
    });

    // --- Add more handlers here later (e.g., delete-alias, edit-alias) ---

    console.log('IPC Handlers Registered.');
}
