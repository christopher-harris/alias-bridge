import { Firestore } from 'firebase-admin/firestore';
import { Alias } from '../types';
import {firebaseAdmin, firestoreAdmin} from './firebase-admin';
import {database} from "firebase-admin";
import Database = database.Database;

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
        const updates: { [key: string]: Alias } = {};
        aliases.forEach(alias => {
            updates[alias.id] = alias;
        });
        await db.ref(`users/${userId}/aliases`).set(updates);
    },

    subscribeToChanges(onChange: (aliases: Alias[]) => void): () => void {
        const ref = db.ref(`users/${userId}/aliases`);
        const listener = ref.on('value', (snapshot) => {
            const data = snapshot.val();
            const aliases = data ? Object.values(data) as Alias[] : [];
            onChange(aliases);
        });

        return () => ref.off('value', listener);
    },

    async uploadAliasToRealtimeDatabase(alias: Alias): Promise<void> {
        await db.ref(`users/${userId}/aliases/${alias.id}`).set(alias);
    },

    async deleteAlias(aliasId: string): Promise<void> {
        await db.ref(`users/${userId}/aliases/${aliasId}`).remove();
    }

};
