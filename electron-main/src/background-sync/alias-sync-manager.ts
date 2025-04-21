import Store from "electron-store";
import logger from "electron-log";
import {cloudSyncService} from "./cloud-sync.service";
import {readAliasData, saveAliasData} from "../data-store";
import {regenerateAliasShellFile} from "../shell-generator";
import {AliasData} from "../types";
import {BrowserWindow} from "electron";


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

    const merged: AliasData = {
        aliases: {},
        deleted: {},
        updatedAt: Date.now(),
        updatedBy: safeLocal.updatedBy || safeCloud.updatedBy,
    };

    const parseTime = (iso?: string): number => (iso ? new Date(iso).getTime() : 0);

    const allIds = new Set([
        ...Object.keys(safeCloud.aliases),
        ...Object.keys(safeLocal.aliases),
        ...Object.keys(safeCloud.deleted),
        ...Object.keys(safeLocal.deleted),
    ]);

    for (const id of allIds) {
        const cloudAlias = safeCloud.aliases[id];
        const localAlias = safeLocal.aliases[id];
        const cloudTombstone = safeCloud.deleted[id];
        const localTombstone = safeLocal.deleted[id];

        const latestTombstone = [cloudTombstone, localTombstone]
            .filter(Boolean)
            .sort((a, b) => parseTime(b?.deletedAt) - parseTime(a?.deletedAt))[0];

        const latestAlias = [cloudAlias, localAlias]
            .filter(Boolean)
            .sort((a, b) => parseTime(b?.lastUpdated) - parseTime(a?.lastUpdated))[0];

        if (latestTombstone && (!latestAlias || parseTime(latestTombstone.deletedAt) > parseTime(latestAlias.lastUpdated))) {
            merged.deleted[id] = latestTombstone;
        } else if (latestAlias) {
            merged.aliases[id] = latestAlias;
        }
    }

    return merged;
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
