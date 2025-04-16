import { FirebaseService } from './firebase.service';
import { cloudSyncService } from './cloud-sync.service';
import dotenv from 'dotenv';
import logger from "electron-log";
import {isLocalNewer} from "../utils/alias-utils";
import {readAliasData, saveAliasData} from "../data-store";

dotenv.config();

let unsubscribe: (() => void) | null = null;

export async function initBackgroundSync() {
    try {
        logger.info('Initializing background sync...');

        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
        };

        const firebaseService = new FirebaseService(firebaseConfig);
        firebaseService.init();

        // Initialize cloudSyncService with firebaseService instance if needed
        await cloudSyncService.init(firebaseService); // optional, if your service needs the Firestore ref

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

export function stopBackgroundSync() {
    if (unsubscribe) {
        logger.info('Stopping background sync...');
        unsubscribe();
        unsubscribe = null;
    }
}
