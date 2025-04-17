import {ipcMain, IpcMainEvent, IpcMainInvokeEvent} from "electron";
import {Alias, IncomingAliasData} from "../types";
import {readAliasData, saveAliasData} from "../data-store";
import {regenerateAliasShellFile} from "../shell-generator";
import {v4 as uuidv4} from 'uuid';
import Store from "electron-store";
import {cloudSyncService} from "../background-sync/cloud-sync.service";

const store = new Store();

export function registerAliasHandlers(): void {
    console.log('Registering Alias IPC Handlers...');

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
                id: uuidv4(),
                created: new Date(),
                lastUpdated: new Date(),
            };

            // Add new alias to the list
            currentAliases.push(IncomingAliasData);

            // Save the updated list back to JSON
            await saveAliasData(currentAliases);

            // Regenerate the .sh file AFTER successfully saving JSON
            await regenerateAliasShellFile(currentAliases);

            console.log(`Alias ${IncomingAliasData.name} processed successfully.`);
            event.reply('add-alias-reply', {success: true, alias: IncomingAliasData});
            if (store.has('user')) {
                cloudSyncService.uploadAliasToRealtimeDatabase(IncomingAliasData);
            }
        } catch (error: any) {
            console.error("Error processing add-alias:", error);
            event.reply('add-alias-reply', {success: false, name: receivedAliasData.name, error: error.message});
        }
    });

    ipcMain.handle('sync-aliases-from-cloud', async (event: IpcMainInvokeEvent, incomingAliases: Alias[]) => {
        console.log('IPC: Handling sync-aliases-from-cloud request');

        try {
            // Replace all aliases with the new list
            await saveAliasData(incomingAliases);

            // Regenerate the .sh file after saving
            await regenerateAliasShellFile(incomingAliases);

            console.log('IPC: Alias sync from cloud completed.');
            return { success: true };
        } catch (error: any) {
            console.error("Error during sync-aliases-from-cloud:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('update-alias', async (event: IpcMainEvent, idToUpdate: string, updatedAliasData: Alias) => {
        // Note: updatedAliasData contains the full object including the ID and potentially modified name/command/comment
        console.log(`IPC: Handling update-alias for ID '${idToUpdate}' with data:`, updatedAliasData);
        let currentAliases: Alias[] = [];

        updatedAliasData = {
            ...updatedAliasData,
            lastUpdated: new Date(),
        };

        console.log(updatedAliasData);

        // Basic validation: Ensure the ID in the data object matches the ID parameter
        if (idToUpdate !== updatedAliasData.id) {
            console.error(`Error processing update-alias: ID mismatch. Param ID: ${idToUpdate}, Object ID: ${updatedAliasData.id}`);
            event.reply('update-alias-reply', {
                success: false,
                id: idToUpdate,
                name: updatedAliasData.name,
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
            currentAliases[indexToUpdate] = {...updatedAliasData, lastUpdated: new Date()};

            // Save the modified list back to JSON
            await saveAliasData(currentAliases);
            cloudSyncService.uploadAliasToRealtimeDatabase(updatedAliasData);

            // Regenerate the .sh file
            await regenerateAliasShellFile(currentAliases);

            console.log(`Alias (ID: ${idToUpdate}) updated successfully to name '${updatedAliasData.name}'.`);
            // Reply with success, include the ID and the (potentially new) name
            event.reply('update-alias-reply', {
                success: true,
                id: idToUpdate,
                name: updatedAliasData.name,
                alias: updatedAliasData
            });

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
            cloudSyncService.deleteAlias(idToDelete);

            // Regenerate the .sh file
            await regenerateAliasShellFile(updatedAliases);

            console.log(`Alias (ID: ${idToDelete}, Name: ${deletedAliasName || 'N/A'}) deleted successfully.`);
            // Reply with success, include the ID and name of the deleted alias
            event.reply('delete-alias-reply', {success: true, id: idToDelete, name: deletedAliasName});

        } catch (error: any) {
            console.error("Error processing delete-alias:", error);
            // Reply with failure, include the ID we tried to delete
            event.reply('delete-alias-reply', {
                success: false,
                id: idToDelete,
                name: deletedAliasName,
                error: error.message
            });
        }
    });
}

