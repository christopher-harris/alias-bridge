import {collection, doc, Firestore, getDocs, onSnapshot, setDoc,} from 'firebase/firestore';
import {Alias} from "../types";

let firestore: Firestore;
const ALIASES_COLLECTION = 'aliases';
const USER_ID = 'default-user'; // replace with dynamic user ID if using auth

export const cloudSyncService = {
    /**
     * Initialize the service with a Firestore instance.
     */
    init(firebaseService: { firestore: Firestore }) {
        firestore = firebaseService.firestore;
    },

    /**
     * Download aliases from Firestore.
     */
    async getAliases(): Promise<Alias[]> {
        const colRef = collection(firestore, `users/${USER_ID}/${ALIASES_COLLECTION}`);
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => doc.data() as Alias);
    },

    /**
     * Upload the full alias array to Firestore.
     */
    async uploadAliases(aliases: Alias[]): Promise<void> {
        const promises = aliases.map(alias => {
            const aliasDoc = doc(firestore, `users/${USER_ID}/${ALIASES_COLLECTION}`, alias.id);
            return setDoc(aliasDoc, alias);
        });

        await Promise.all(promises);
    },

    /**
     * Subscribe to Firestore changes and call the callback with new data.
     */
    subscribeToChanges(onChange: (aliases: Alias[]) => void): () => void {
        const colRef = collection(firestore, `users/${USER_ID}/${ALIASES_COLLECTION}`);
        return onSnapshot(colRef, snapshot => {
            const updatedAliases = snapshot.docs.map(doc => doc.data() as Alias);
            onChange(updatedAliases);
        });
    }
};
