import {firebaseAdmin, getDatabase} from "./firebase-admin";
import {Alias, AliasData, DeletedAlias} from "../types";
import {database} from "firebase-admin";
import {getClientId} from "../client-id";
import logger from "electron-log";
import {FIREBASE_ENV} from "../config";

let db: database.Database;
let userId: string | null = null;

function getUserPath(userId: string) {
    logger.info('Cloud-Sync env: ', FIREBASE_ENV);
    return `${FIREBASE_ENV}/users/${userId}`;
    // const env = process.env.FIREBASE_ENV || 'dev';
    // logger.info('Cloud-Sync env: ', env);
    // return `${env}/users/${userId}`;
}

export const cloudSyncService = {
    init(uid?: string) {
        if (uid) userId = uid;
        if (!db) {
            db = getDatabase();
        }
    },

    async getAliases(): Promise<AliasData> {
        if (!db) {
            console.error('CloudSyncService accessed before init or Firebase Admin initialized.');
            throw new Error('Database not available');
        }

        if (!userId) {
            throw new Error('[getAliases]: User ID not set. cloudSyncService.init(uid) must be called with a valid user ID before using this method.');
        }

        try {
            const snapshot = await db.ref(getUserPath(userId)).once('value');
            const data = snapshot.val();

            return {
                aliases: data?.aliases || {},
                deleted: data?.deleted || {},
                updatedAt: data?.updatedAt || 0,
                updatedBy: data?.updatedBy || '',
            };
        } catch (error) {
            console.error('Error fetching AliasData from database:', error);
            throw error;
        }
    },

    async uploadAliases(data: AliasData): Promise<void> {
        logger.info("cloud-sync-service: uploading aliases");
        if (!db) throw new Error('Database not available');

        if (!userId) {
            throw new Error('[uploadAliases]: User ID not set. cloudSyncService.init(uid) must be called with a valid user ID before using this method.');
        }

        try {
            const clientId = getClientId();
            await db.ref(getUserPath(userId)).set({
                aliases: data.aliases,
                deleted: data.deleted,
                updatedBy: clientId,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Error uploading AliasData to database:', error);
            throw error;
        }
    },

    subscribeToChanges(onChange: (data: AliasData) => void): () => void {
        if (!db) throw new Error('Database not available');

        if (!userId) {
            throw new Error('[subscribeToChanges]: User ID not set. cloudSyncService.init(uid) must be called with a valid user ID before using this method.');
        }

        const clientId = getClientId();
        const ref = db.ref(getUserPath(userId));

        const listener = ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data || data.updatedBy === clientId) return;

            onChange({
                aliases: data.aliases || {},
                deleted: data.deleted || {},
                updatedAt: data.updatedAt || 0,
                updatedBy: data.updatedBy || ''
            });
        });

        return () => ref.off('value', listener);
    },

    async uploadAliasToRealtimeDatabase(alias: Alias): Promise<void> {
        if (!db) throw new Error('Database not available');

        if (!userId) {
            throw new Error('[uploadAliasToRealtimeDatabase]: User ID not set. cloudSyncService.init(uid) must be called with a valid user ID before using this method.');
        }

        const clientId = getClientId();
        const updates: Record<string, any> = {
            [`aliases/${alias.id}`]: alias,
            updatedBy: clientId,
            updatedAt: Date.now(),
        };

        await db.ref(getUserPath(userId)).update(updates);
    },

    async deleteAlias(aliasId: string): Promise<void> {
        if (!db) throw new Error('Database not available');

        if (!userId) {
            throw new Error('[deleteAlias]: User ID not set. cloudSyncService.init(uid) must be called with a valid user ID before using this method.');
        }

        const clientId = getClientId();

        const tombstone: DeletedAlias = {
            id: aliasId,
            deletedAt: Date.now().toString(),
        };

        const updates: Record<string, any> = {
            [`aliases/${aliasId}`]: null,
            [`deleted/${aliasId}`]: tombstone,
            updatedBy: clientId,
            updatedAt: Date.now()
        };

        await db.ref(getUserPath(userId)).update(updates);
    }
};
