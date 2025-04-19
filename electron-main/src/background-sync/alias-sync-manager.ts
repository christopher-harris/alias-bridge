import dotenv from "dotenv";
import Store from "electron-store";
import logger from "electron-log";
import {cloudSyncService} from "./cloud-sync.service";
import {readAliasData, saveAliasData} from "../data-store";
import {regenerateAliasShellFile} from "../shell-generator";
import {Alias, AliasData, DeletedAlias} from "../types";
import {BrowserWindow} from "electron";


dotenv.config();

let unsubscribe: (() => void) | null = null;
const store = new Store();

export async function initBackgroundSync() {
    const user = store.get('user');
    if (!user) {
        logger.error('User not logged in. Cannot initialize background sync.');
        return;
    }

    try {
        logger.info('Initializing background sync...');
        cloudSyncService.init();

        const [cloudAliasData, localAliasData] = await Promise.all([
            cloudSyncService.getAliases(), // should return AliasData
            readAliasData()
        ]);

        logger.info('Merging cloud and local aliases...');
        const mergedAliasData = mergeAliasData(cloudAliasData, localAliasData);

        await saveAliasData(mergedAliasData);
        await regenerateAliasShellFile(mergedAliasData);
        notifyUIOfAliasUpdate(mergedAliasData);

        await cloudSyncService.uploadAliases(mergedAliasData);

        unsubscribe = cloudSyncService.subscribeToChanges(async (remoteAliasData) => {
            logger.info('Remote update received. Saving to local...');
            await saveAliasData(remoteAliasData);
            await regenerateAliasShellFile(remoteAliasData);
            notifyUIOfAliasUpdate(remoteAliasData);
        });

        logger.info('Background sync initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize background sync:', error);
    }
}

// 🔁 Merges two AliasData objects (cloud and local)
export function mergeAliasData(cloud: AliasData | undefined, local: AliasData | undefined): AliasData {
    const safeCloud = cloud ?? { aliases: {}, deleted: {}, updatedAt: 0, updatedBy: '' };
    const safeLocal = local ?? { aliases: {}, deleted: {}, updatedAt: 0, updatedBy: '' };

    const mergedAliases = {
        ...safeCloud.aliases,
        ...safeLocal.aliases
    };

    const mergedDeleted = {
        ...safeCloud.deleted,
        ...safeLocal.deleted
    }

    // for (const [id, localAlias] of Object.entries(local.aliases)) {
    //     const cloudAlias = mergedAliases[id];
    //     if (!cloudAlias || localAlias.lastUpdated! > cloudAlias.lastUpdated!) {
    //         mergedAliases[id] = localAlias;
    //     }
    // }

    return {
        aliases: mergedAliases,
        deleted: mergedDeleted,
        updatedAt: Math.max(safeCloud.updatedAt, safeLocal.updatedAt),
        updatedBy: safeLocal.updatedBy || safeCloud.updatedBy
    };

    // const mergedDeleted: Record<string, DeletedAlias> = {
    //     ...cloud.deleted,
    //     ...local.deleted,
    // };
    //
    // return {
    //     updatedAt: Date.now(),
    //     updatedBy: local.updatedBy || cloud.updatedBy,
    //     aliases: mergedAliases,
    //     deleted: mergedDeleted
    // };
}

function notifyUIOfAliasUpdate(aliasData: AliasData) {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
        win.webContents.send('aliases-updated', Object.values(aliasData.aliases));
    }
}

export function stopBackgroundSync() {
    if (unsubscribe) {
        logger.info('Stopping background sync...');
        unsubscribe();
        unsubscribe = null;
    }
}




// import { cloudSyncService } from './cloud-sync.service';
// import dotenv from 'dotenv';
// import logger from "electron-log";
// import {isLocalNewer} from "../utils/alias-utils";
// import {readAliasData, saveAliasData} from "../data-store";
// import {Alias} from "../types";
// import {regenerateAliasShellFile} from "../shell-generator";
// import {BrowserWindow} from "electron";
// import Store from "electron-store";
//
// dotenv.config();
//
// let unsubscribe: (() => void) | null = null;
//
// const store = new Store();
//
// export async function initBackgroundSync() {
//     const user = store.get('user');
//     if (!user) {
//         logger.error('User not logged in. Cannot initialize background sync.');
//         return;
//     }
//     try {
//         logger.info('Initializing background sync...');
//
//         // Initialize cloudSyncService with firebaseService instance if needed
//         cloudSyncService.init();
//
//         const [cloudAliases, localAliases] = await Promise.all([
//             cloudSyncService.getAliases(),
//             readAliasData()
//         ]);
//
//         logger.info('Merging cloud and local aliases...');
//         const mergedAliases = mergeAliasLists(cloudAliases, localAliases);
//
//         // Save merged to local storage
//         await saveAliasData(mergedAliases);
//
//         // Regenerate .sh file with merged aliases
//         await regenerateAliasShellFile(mergedAliases);
//
//         // Update the UI with merged data
//         notifyUIOfAliasUpdate(mergedAliases);
//
//         // Upload the merged result to the cloud
//         await cloudSyncService.uploadAliases(mergedAliases);
//         // if (isLocalNewer(localAliases, cloudAliases)) {
//         //     logger.info('Uploading newer local aliases to cloud...');
//         //     await cloudSyncService.uploadAliases(localAliases);
//         // } else {
//         //     logger.info('Using cloud aliases, writing them locally...');
//         //     await saveAliasData(cloudAliases);
//         //     await regenerateAliasShellFile(cloudAliases);
//         //     notifyUIOfAliasUpdate(cloudAliases);
//         // }
//
//         // Start live listener
//         unsubscribe = cloudSyncService.subscribeToChanges(async (remoteAliases) => {
//             logger.info('Remote update received. Saving to local...');
//             const currentLocalAliases = await readAliasData();
//
//             await saveAliasData(remoteAliases);
//
//             await regenerateAliasShellFile(remoteAliases);
//
//             const savedAliasesData = await readAliasData();
//
//             notifyUIOfAliasUpdate(savedAliasesData);
//         });
//
//         logger.info('Background sync initialized successfully.');
//     } catch (error) {
//         logger.error('Failed to initialize background sync:', error);
//     }
// }
//
// export function mergeAliasLists(cloud: Alias[], local: Alias[]): Alias[] {
//     const mergedMap = new Map<string, Alias>();
//
//     for (const alias of cloud) {
//         mergedMap.set(alias.id, alias);
//     }
//
//     for (const alias of local) {
//         const existing = mergedMap.get(alias.id);
//         if (!existing || alias.lastUpdated! > existing.lastUpdated!) {
//             mergedMap.set(alias.id, alias);
//         }
//     }
//
//     return Array.from(mergedMap.values());
// }
//
//
// function notifyUIOfAliasUpdate(updatedAliases: Alias[]) {
//     const win = BrowserWindow.getAllWindows()[0]; // or however you're managing your main window
//     if (win) {
//         win.webContents.send('aliases-updated', updatedAliases);
//     }
// }
//
//
// export function stopBackgroundSync() {
//     if (unsubscribe) {
//         logger.info('Stopping background sync...');
//         unsubscribe();
//         unsubscribe = null;
//     }
// }
