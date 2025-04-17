import {ipcMain, IpcMainInvokeEvent} from "electron";
import Store from "electron-store";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import {initBackgroundSync} from "../background-sync/alias-sync-manager";
import {authAdmin, firestoreAdmin} from "../background-sync/firebase-admin";
import {cloudSyncService} from "../background-sync/cloud-sync.service";

dotenv.config();

const store = new Store();

export function firestoreAuthHandlers(): void {
    console.log('Firestore Auth handlers');

    ipcMain.on('firebase-github-auth', async (event, userData: { user: any, token: string }) => {
        try {
            // Verify the Firebase ID token received from Angular
            const decodedToken = await authAdmin.verifyIdToken(userData.token);
            console.log('Firebase decoded token', decodedToken);

            const userDataToStore = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture,
                token: userData.token,
            };

            console.log(userDataToStore);

            // Store user in electron-store
            store.set('user', userDataToStore);

            cloudSyncService.init(decodedToken.uid);
            await initBackgroundSync();

            // Send the authenticated user's data back to Angular (if needed)
            event.reply('firebase-github-auth-success', decodedToken);
        } catch (error) {
            console.error('Authentication failed:', error);
            event.reply('firebase-github-auth-error', error);
        }
    });

}
