// import {ipcMain, IpcMainInvokeEvent} from "electron";
// import Store from "electron-store";
// import admin from "firebase-admin";
// import dotenv from "dotenv";
//
// dotenv.config();
//
// const store = new Store();
//
// admin.initializeApp({
//     credential: admin.credential.applicationDefault(), // Use applicationDefault() or a service account JSON file
//     databaseURL: process.env.FIREBASE_DATABASE_URL,
// });
//
// export function firestoreAuthHandlers(): void {
//     console.log('Firestore Auth handlers');
//
//     ipcMain.on('firebase-github-auth', async (event, userData: { user: any, token: string }) => {
//         try {
//             // Verify the Firebase ID token received from Angular
//             const decodedToken = await admin.auth().verifyIdToken(userData.token);
//             console.log('Firebase decoded token', decodedToken);
//
//             // Send the authenticated user's data back to Angular (if needed)
//             event.reply('firebase-github-auth-success', decodedToken);
//         } catch (error) {
//             console.error('Authentication failed:', error);
//             event.reply('firebase-github-auth-error', error);
//         }
//     });
//
// }
