import { Alias } from '../types';
import {firebaseAdmin} from './firebase-admin';
import {database} from "firebase-admin";
import Database = database.Database;
import {getClientId} from "../client-id";

/**
 * Firestore instance shared by all cloud sync operations.
 * This is initialized via the `firebase-admin.ts` module to ensure `initializeApp()` has been called.
 */
// let db: Firestore = firestoreAdmin;
let db: Database = firebaseAdmin.database();

/**
 * UID of the currently authenticated Firebase user.
 * Defaults to 'anonymous' if `init()` hasn't been called.
 */
let userId = 'anonymous';

/**
 * Service for managing synchronization of aliases with the Firebase Firestore backend.
 * Handles CRUD operations and real-time updates.
 */
export const cloudSyncService = {
    /**
     * Initializes the sync service with the authenticated user's UID.
     * Must be called after Firebase authentication is completed.
     *
     * @param uid - The Firebase user's UID. If omitted, sync will use 'anonymous'.
     */
    init(uid?: string) {
        if (uid) userId = uid;
    },

    async getAliases(): Promise<Alias[]> {
        const snapshot = await db.ref(`users/${userId}/aliases`).once('value');
        const data = snapshot.val();
        return data ? Object.values(data) as Alias[] : [];
    },

    async uploadAliases(aliases: Alias[]): Promise<void> {
        const clientId = getClientId();
        console.log('uploadAliases clientId: ', clientId);

        const updates: { [key: string]: Alias } = {};
        aliases.forEach(alias => {
            updates[alias.id] = alias;
        });

        await db.ref(`users/${userId}`).set({
            aliases: updates,
            updatedBy: clientId,
            updatedAt: Date.now()
        });
    },

    subscribeToChanges(onChange: (aliases: Alias[]) => void): () => void {
        const clientId = getClientId();
        const ref = db.ref(`users/${userId}`);
        const listener = ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data || data.updatedBy === clientId) return;

            const aliases = data.aliases ? Object.values(data.aliases) as Alias[] : [];
            onChange(aliases);
        });

        return () => ref.off('value', listener);
    },

    async uploadAliasToRealtimeDatabase(alias: Alias): Promise<void> {
        const clientId = getClientId();
        console.log('uploadAliases clientId: ', clientId);

        const updates: { [key: string]: any } = {};

        // Only update the alias we care about
        updates[`aliases/${alias.id}`] = alias;
        // Update metadata too
        updates['updatedBy'] = clientId;
        updates['updatedAt'] = Date.now();

        await db.ref(`users/${userId}`).update(updates);
    },

    async deleteAlias(aliasId: string): Promise<void> {
        await db.ref(`users/${userId}/aliases/${aliasId}`).remove();
    }

};
