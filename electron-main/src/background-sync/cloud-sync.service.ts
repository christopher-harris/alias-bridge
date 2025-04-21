import {firebaseAdmin} from "./firebase-admin";
import {Alias, AliasData, DeletedAlias} from "../types";
import {database} from "firebase-admin";
import {getClientId} from "../client-id";

const db: database.Database = firebaseAdmin.database();
let userId = 'anonymous';

function getUserPath(userId: string) {
    const env = process.env.FIREBASE_ENV || 'dev';
    return `${env}/users/${userId}`;
}

export const cloudSyncService = {
    init(uid?: string) {
        if (uid) userId = uid;
    },

    async getAliases(): Promise<AliasData> {
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
        const clientId = getClientId();
        const updates: Record<string, any> = {
            [`aliases/${alias.id}`]: alias,
            updatedBy: clientId,
            updatedAt: Date.now(),
        };

        await db.ref(getUserPath(userId)).update(updates);
    },

    async deleteAlias(aliasId: string): Promise<void> {
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
