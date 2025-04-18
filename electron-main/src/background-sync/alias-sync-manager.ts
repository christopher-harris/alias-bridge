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

        if (isLocalNewer(localAliases, cloudAliases)) {
            logger.info('Uploading newer local aliases to cloud...');
            await cloudSyncService.uploadAliases(localAliases);
        } else {
            logger.info('Using cloud aliases, writing them locally...');
            await saveAliasData(cloudAliases);
        }

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

// async function handleDeletions(local: Alias[], cloud: Alias[]): Promise<void> {
//     // Find deleted aliases locally (present in cloud, but missing from local)
//     const deletedInLocal = cloud.filter(
//         cloudAlias => !local.some(localAlias => localAlias.id === cloudAlias.id)
//     );
//
//     // Find deleted aliases in the cloud (present in local, but missing from cloud)
//     const deletedInCloud = local.filter(
//         localAlias => !cloud.some(cloudAlias => cloudAlias.id === localAlias.id)
//     );
//
//     // Delete missing aliases from the cloud
//     await Promise.all(
//         deletedInLocal.map(alias =>
//             cloudSyncService.deleteAlias(alias.id)
//         )
//     );
//
//     // Delete missing aliases locally
//     await Promise.all(
//         deletedInCloud.map(alias =>
//             deleteAliasData(alias.id)
//         )
//     );
// }

// async function deleteAliasData(aliasId: string): Promise<void> {
//     // Implement your local deletion logic here
//     console.log(`Deleting alias ${aliasId} from local storage...`);
//     // For example, you might remove the alias from a local JSON file or database
// }


// async function deleteCloudAlias(aliasId: string): Promise<void> {
//     // Implement your cloud deletion logic here
//     console.log(`Deleting alias ${aliasId} from cloud storage...`);
//     // For example, you would call Firebase's database API to delete the alias
//     await cloudSyncService.deleteAlias(aliasId);
// }


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
