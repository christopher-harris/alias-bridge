import {BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent, nativeTheme} from "electron";
import {PLATFORM} from "./config";
import {Alias, AppearanceSetting, IncomingAliasData, PrimeTheme} from "./types";
import {readAliasData, saveAliasData} from "./data-store";
import {regenerateAliasShellFile} from "./shell-generator";
import { v4 as uuidv4 } from 'uuid';
import {
    getCurrentAppearance,
    getAppearanceSetting,
    setAppearanceSetting,
    getPrimeThemeSetting, setPrimeThemeSetting
} from "./settings-manager";
import {registerUpdateHandlers} from "./ipc";

export function registerAllIpcHandlers(): void {
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

    ipcMain.on('add-alias', async (event: IpcMainEvent, receivedAliasData: IncomingAliasData) => {
        console.log('IPC: Handling add-alias request: ', receivedAliasData);
        let currentAliases: Alias[] = [];

        try {
            currentAliases = await readAliasData();

            // Check for duplicate NAME before adding
            const nameExists = currentAliases.some(alias => alias.name === receivedAliasData.name);
            if (nameExists) {
                // Throw an error if name exists
                throw new Error(`An alias with the name "${receivedAliasData.name}" already exists. Please choose a unique name or edit the existing alias.`);
            }

            // Generate new UUID and create the Alias object
            const IncomingAliasData: Alias = {
                ...receivedAliasData,
                id: uuidv4()
            };

            // Add new alias to the list
            currentAliases.push(IncomingAliasData);

            // Save the updated list back to JSON
            await saveAliasData(currentAliases);

            // Regenerate the .sh file AFTER successfully saving JSON
            await regenerateAliasShellFile(currentAliases);

            console.log(`Alias ${IncomingAliasData.name} processed successfully.`);
            event.reply('add-alias-reply', {success: true, alias: IncomingAliasData});

        } catch (error: any) {
            console.error("Error processing add-alias:", error);
            event.reply('add-alias-reply', {success: false, name: receivedAliasData.name, error: error.message});
        }
    });

    ipcMain.on('update-alias', async (event: IpcMainEvent, idToUpdate: string, updatedAliasData: Alias) => {
        // Note: updatedAliasData contains the full object including the ID and potentially modified name/command/comment
        console.log(`IPC: Handling update-alias for ID '${idToUpdate}' with data:`, updatedAliasData);
        let currentAliases: Alias[] = [];

        // Basic validation: Ensure the ID in the data object matches the ID parameter
        if (idToUpdate !== updatedAliasData.id) {
            console.error(`Error processing update-alias: ID mismatch. Param ID: ${idToUpdate}, Object ID: ${updatedAliasData.id}`);
            event.reply('update-alias-reply', {
                success: false,
                id: idToUpdate,
                name: updatedAliasData.name, // Use the potentially new name for context
                error: 'Internal error: Alias ID mismatch.'
            });
            return; // Stop processing
        }

        try {
            currentAliases = await readAliasData();

            // Find the index of the alias to update using its unique ID
            const indexToUpdate = currentAliases.findIndex(a => a.id === idToUpdate);

            if (indexToUpdate === -1) {
                // Alias with the given ID was not found
                throw new Error(`Alias with ID "${idToUpdate}" not found.`);
            }

            // --- Check for Name Conflicts ---
            // See if the *new* name conflicts with any *other* existing alias
            const originalName = currentAliases[indexToUpdate].name; // Get the name before update
            if (originalName !== updatedAliasData.name) { // Check only if name actually changed
                const newNameExists = currentAliases.some(
                    (a, index) => a.name === updatedAliasData.name && index !== indexToUpdate
                );
                if (newNameExists) {
                    throw new Error(`Cannot update: An alias with the new name "${updatedAliasData.name}" already exists.`);
                }
            }

            // --- Update the Alias ---
            // Replace the old alias object at the found index with the updated data
            currentAliases[indexToUpdate] = updatedAliasData;

            // Save the modified list back to JSON
            await saveAliasData(currentAliases);

            // Regenerate the .sh file
            await regenerateAliasShellFile(currentAliases);

            console.log(`Alias (ID: ${idToUpdate}) updated successfully to name '${updatedAliasData.name}'.`);
            // Reply with success, include the ID and the (potentially new) name
            event.reply('update-alias-reply', { success: true, id: idToUpdate, name: updatedAliasData.name });

        } catch (error: any) {
            console.error("Error processing update-alias:", error);
            // Reply with failure, include the ID and the attempted new name
            event.reply('update-alias-reply', {
                success: false,
                id: idToUpdate,
                name: updatedAliasData.name, // Use potentially updated name for context
                error: error.message
            });
        }
    });

    ipcMain.on('delete-alias', async (event: IpcMainEvent, idToDelete: string) => {
        // Note: We now receive the ID, not the name
        console.log(`IPC: Handling delete-alias request for ID: ${idToDelete}`);
        let currentAliases: Alias[] = [];
        let deletedAliasName: string | null = null; // Store name for reply message

        try {
            currentAliases = await readAliasData();

            // Find the alias to get its name for the reply message (optional but nice)
            const aliasToDelete = currentAliases.find(a => a.id === idToDelete);
            deletedAliasName = aliasToDelete ? aliasToDelete.name : null;

            // Filter out the alias using its ID
            const updatedAliases = currentAliases.filter(a => a.id !== idToDelete);

            // Check if an alias was actually removed
            if (updatedAliases.length === currentAliases.length) {
                // No alias with the given ID was found
                // Option 1: Throw an error
                throw new Error(`Alias with ID "${idToDelete}" not found for deletion.`);
                // Option 2: Log a warning and reply success (treat as idempotent)
                // console.warn(`Alias with ID '${idToDelete}' not found for deletion, but proceeding.`);
            }

            // Save the filtered list (without the deleted alias) back to JSON
            await saveAliasData(updatedAliases);

            // Regenerate the .sh file
            await regenerateAliasShellFile(updatedAliases);

            console.log(`Alias (ID: ${idToDelete}, Name: ${deletedAliasName || 'N/A'}) deleted successfully.`);
            // Reply with success, include the ID and name of the deleted alias
            event.reply('delete-alias-reply', { success: true, id: idToDelete, name: deletedAliasName });

        } catch (error: any) {
            console.error("Error processing delete-alias:", error);
            // Reply with failure, include the ID we tried to delete
            event.reply('delete-alias-reply', { success: false, id: idToDelete, name: deletedAliasName, error: error.message });
        }
    });

    // APPEARANCE/SETTINGS HANDLERS
    ipcMain.handle('settings:get-appearance', (): AppearanceSetting => {
        console.log('IPC: Handling settings:get-appearance');
        return getAppearanceSetting();
    });

    ipcMain.handle('settings:set-appearance', (event, appearance: AppearanceSetting) => {
        // Note: Using handle means we could return success/failure, but
        // for simple settings, just performing the action might be enough.
        // Or use ipcMain.on if no return value is needed.
        console.log(`IPC: Handling settings:set-appearance request: ${appearance}`);
        try {
            setAppearanceSetting(appearance);
            // --- IMPORTANT: Notify renderer about the effective appearance change ---
            // We need access to the main window to send the update
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                const effectiveappearance = getCurrentAppearance();
                console.log(`Notifying renderer of effective appearance change: ${effectiveappearance}`);
                window.webContents.send('appearance-updated', effectiveappearance);
            }
            return { success: true };
        } catch (error: any) {
            console.error("Error in settings:set-appearance:", error);
            return { success: false, error: error.message };
        }
    });

    /**
     * Provides the *current* OS appearance, ignoring user setting
     */
    ipcMain.handle('appearance:get-system-appearance', (): 'light' | 'dark' => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });

    /**
     * Provides the appearance that should currently be applied based on setting + system
     */
    ipcMain.handle('appearance:get-current-effective-appearance', (): 'light' | 'dark' => {
        return getCurrentAppearance();
    });

    /**
     * Provides the selected Prime Theme
     */
    ipcMain.handle('settings:get-current-prime-theme', (): PrimeTheme => {
        return getPrimeThemeSetting();
    });

    /**
     * Sets Prime Theme
     */
    ipcMain.handle('settings:set-prime-theme', (event, theme: PrimeTheme): any => {
        try {
            setPrimeThemeSetting(theme);
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                const theme = getPrimeThemeSetting();
                window.webContents.send('theme:theme-updated', theme);
            }
            return { success: true, theme };
        } catch (error: any) {
            console.error("Error setting theme:", error);
            return { success: false, error: error.message };
        }
    });

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
