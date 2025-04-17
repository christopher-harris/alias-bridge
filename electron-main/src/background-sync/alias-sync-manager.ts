import { FirebaseService } from './firebase.service';
import { cloudSyncService } from './cloud-sync.service';
import dotenv from 'dotenv';
import logger from "electron-log";
import {isLocalNewer} from "../utils/alias-utils";
import {readAliasData, saveAliasData} from "../data-store";
import {firestoreAdmin} from "./firebase-admin";
import {Alias} from "../types";

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
            await saveAliasData(remoteAliases);
        });

        logger.info('Background sync initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize background sync:', error);
    }
}

/**
 * Compare and merge local and cloud aliases based on `lastUpdated` timestamp.
 * It will also remove duplicates and ensure both ends are synchronized.
 *
 * @param local The list of local aliases
 * @param cloud The list of cloud aliases
 * @returns The merged list of aliases
 */
function mergeAliases(local: Alias[], cloud: Alias[]): Alias[] {
    const merged: Alias[] = [];

    // Combine both lists by id, keeping the latest one
    const allAliases = [...local, ...cloud];
    const uniqueAliases = new Map<string, Alias>();

    for (const alias of allAliases) {
        const existingAlias = uniqueAliases.get(alias.id);
        if (!existingAlias || alias?.lastUpdated! > existingAlias.lastUpdated!) {
            uniqueAliases.set(alias.id, alias);
        }
    }

    // Return merged list, sorted by lastUpdated in descending order
    return Array.from(uniqueAliases.values()).sort(
        (a, b) => (b.lastUpdated?.getTime() ?? 0) - (a.lastUpdated?.getTime() ?? 0) // Compare timestamps
    );
}

/**
 * Handle alias deletions: check for missing aliases and remove them from either
 * local or cloud storage.
 *
 * @param local The list of local aliases
 * @param cloud The list of cloud aliases
 */
async function handleDeletions(local: Alias[], cloud: Alias[]): Promise<void> {
    // Find deleted aliases locally (present in cloud, but missing from local)
    const deletedInLocal = cloud.filter(
        cloudAlias => !local.some(localAlias => localAlias.id === cloudAlias.id)
    );

    // Find deleted aliases in the cloud (present in local, but missing from cloud)
    const deletedInCloud = local.filter(
        localAlias => !cloud.some(cloudAlias => cloudAlias.id === localAlias.id)
    );

    // Delete missing aliases from the cloud
    await Promise.all(
        deletedInLocal.map(alias =>
            cloudSyncService.deleteAlias(alias.id)
        )
    );

    // Delete missing aliases locally
    await Promise.all(
        deletedInCloud.map(alias =>
            deleteAliasData(alias.id)
        )
    );
}

/**
 * Delete alias from the local storage.
 *
 * @param aliasId The ID of the alias to be deleted.
 */
async function deleteAliasData(aliasId: string): Promise<void> {
    // Implement your local deletion logic here
    console.log(`Deleting alias ${aliasId} from local storage...`);
    // For example, you might remove the alias from a local JSON file or database
}

/**
 * Delete alias from the cloud storage.
 *
 * @param aliasId The ID of the alias to be deleted.
 */
async function deleteCloudAlias(aliasId: string): Promise<void> {
    // Implement your cloud deletion logic here
    console.log(`Deleting alias ${aliasId} from cloud storage...`);
    // For example, you would call Firebase's database API to delete the alias
    await cloudSyncService.deleteAlias(aliasId);
}

export function stopBackgroundSync() {
    if (unsubscribe) {
        logger.info('Stopping background sync...');
        unsubscribe();
        unsubscribe = null;
    }
}
