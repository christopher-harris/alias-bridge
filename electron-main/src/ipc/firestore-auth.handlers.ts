import {ipcMain, IpcMainInvokeEvent} from "electron";
import Store from "electron-store";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import {initBackgroundSync, stopBackgroundSync} from "../background-sync/alias-sync-manager";
import {authAdmin, firestoreAdmin} from "../background-sync/firebase-admin";
import {cloudSyncService} from "../background-sync/cloud-sync.service";

dotenv.config();

const store = new Store();

/**
 * Initializes and registers IPC handlers for Firebase authentication operations.
 * This function sets up event listeners for GitHub-based Firebase authentication
 * and manages the authentication state in the electron store.
 * 
 * @remarks
 * This handler performs the following operations:
 * - Verifies Firebase ID tokens received from the Angular frontend
 * - Stores authenticated user data in electron-store
 * - Initializes cloud synchronization for the authenticated user
 * - Handles authentication errors and success responses
 * 
 * @example
 * ```typescript
 * // Register the handlers
 * firestoreAuthHandlers();
 * ```
 */
export function firestoreAuthHandlers(): void {
    console.log('Firestore Auth handlers');

    /**
     * Handles GitHub-based Firebase authentication requests from the renderer process.
     * Verifies the provided Firebase ID token and sets up user data storage and sync.
     * 
     * @param event - The IPC event object
     * @param userData - Object containing user data and Firebase token
     * @param userData.user - The user object from Firebase
     * @param userData.token - The Firebase ID token to verify
     * 
     * @fires firebase-github-auth-success - Emitted when authentication succeeds
     * @fires firebase-github-auth-error - Emitted when authentication fails
     */
    ipcMain.on('firebase-github-auth', async (event, userData: { user: any, token: string }) => {
        try {
            // Verify the Firebase ID token received from Angular
            const decodedToken = await authAdmin().verifyIdToken(userData.token);

            const userDataToStore = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                token: userData.token,
            };

            // Store user in electron-store
            store.set('user', userDataToStore);

            cloudSyncService.init(decodedToken.uid);
            await initBackgroundSync();

            // Send the authenticated user's data back to Angular
            event.reply('firebase-github-auth-success', decodedToken);
        } catch (error) {
            console.error('Authentication failed:', error);
            event.reply('firebase-github-auth-error', error);
        }
    });
}

/**
 * Handles user logout requests from the renderer process.
 * Clears stored user data and stops background synchronization.
 * 
 * @fires firebase-logout-success - Emitted when logout succeeds
 * @fires firebase-logout-error - Emitted when logout fails
 */
ipcMain.on('firebase-logout', async (event) => {
    try {
        // Clear user data from electron-store
        store.delete('user');

        // Stop cloud sync service
        stopBackgroundSync();

        // Notify renderer about a successful logout
        event.reply('firebase-logout-success');
    } catch (error) {
        console.error('Logout failed:', error);
        event.reply('firebase-logout-error', error);
    }
});
