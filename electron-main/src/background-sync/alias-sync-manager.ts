import { cloudSyncService } from './cloud-sync.service';
import dotenv from 'dotenv';
import logger from "electron-log";
import {isLocalNewer} from "../utils/alias-utils";
import {readAliasData, saveAliasData} from "../data-store";
import {Alias} from "../types";
import {regenerateAliasShellFile} from "../shell-generator";
import {BrowserWindow} from "electron";

dotenv.config();

let unsubscribe: (() => void) | null = null;

export async function initBackgroundSync() {
    try {
        logger.info('Initializing background sync...');

        // Initialize cloudSyncService with firebaseService instance if needed
        cloudSyncService.init();

        const [cloudAliases, localAliases] = await Promise.all([
            cloudSyncService.getAliases(),
            readAliasData()
        ]);

        logger.info('Merging cloud and local aliases...');
        const mergedAliases = mergeAliasLists(cloudAliases, localAliases);

        // Save merged to local storage
        await saveAliasData(mergedAliases);

        // Regenerate .sh file with merged aliases
        await regenerateAliasShellFile(mergedAliases);

        // Update the UI with merged data
        notifyUIOfAliasUpdate(mergedAliases);

        // Upload the merged result to the cloud
        await cloudSyncService.uploadAliases(mergedAliases);
        // if (isLocalNewer(localAliases, cloudAliases)) {
        //     logger.info('Uploading newer local aliases to cloud...');
        //     await cloudSyncService.uploadAliases(localAliases);
        // } else {
        //     logger.info('Using cloud aliases, writing them locally...');
        //     await saveAliasData(cloudAliases);
        //     await regenerateAliasShellFile(cloudAliases);
        //     notifyUIOfAliasUpdate(cloudAliases);
        // }

        // Start live listener
        unsubscribe = cloudSyncService.subscribeToChanges(async (remoteAliases) => {
            logger.info('Remote update received. Saving to local...');
            const currentLocalAliases = await readAliasData();

            await saveAliasData(remoteAliases);

            await regenerateAliasShellFile(remoteAliases);

            const savedAliasesData = await readAliasData();

            notifyUIOfAliasUpdate(savedAliasesData);
        });

        logger.info('Background sync initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize background sync:', error);
    }
}

export function mergeAliasLists(cloud: Alias[], local: Alias[]): Alias[] {
    const mergedMap = new Map<string, Alias>();

    for (const alias of cloud) {
        mergedMap.set(alias.id, alias);
    }

    for (const alias of local) {
        const existing = mergedMap.get(alias.id);
        if (!existing || alias.lastUpdated! > existing.lastUpdated!) {
            mergedMap.set(alias.id, alias);
        }
    }

    return Array.from(mergedMap.values());
}


function notifyUIOfAliasUpdate(updatedAliases: Alias[]) {
    const win = BrowserWindow.getAllWindows()[0]; // or however you're managing your main window
    if (win) {
        win.webContents.send('aliases-updated', updatedAliases);
    }
}


export function stopBackgroundSync() {
    if (unsubscribe) {
        logger.info('Stopping background sync...');
        unsubscribe();
        unsubscribe = null;
    }
}
