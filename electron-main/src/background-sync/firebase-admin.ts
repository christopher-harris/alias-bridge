import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from "path";
import {SecureCredentialsManager} from "./credential.manager";

const isProd = process.env.NODE_ENV === 'production';

class FirebaseAdminService {
    private static instance: FirebaseAdminService;
    private _admin: typeof admin | null = null;
    private _firestore: admin.firestore.Firestore | null = null;
    private _database: admin.database.Database | null = null;
    private _auth: admin.auth.Auth | null = null;
    private initialized = false;
    private initializationPromise: Promise<void> | null = null;

    private constructor() {}

    static getInstance(): FirebaseAdminService {
        if (!FirebaseAdminService.instance) {
            FirebaseAdminService.instance = new FirebaseAdminService();
        }
        return FirebaseAdminService.instance;
    }

    async initialize() {
        if (this.initialized) return;

        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }

        this.initializationPromise = (async () => {
            try {
                const serviceAccount = await SecureCredentialsManager.loadCredentials();

                if (!serviceAccount) {
                    throw new Error('Failed to load Firebase credentials');
                }

                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
                    });
                    console.log('[FirebaseAdmin] initialized for project', serviceAccount.project_id);
                }

                this._admin = admin;
                this._database = admin.database();
                this._firestore = admin.firestore();
                this._auth = admin.auth();
                this.initialized = true;
            } catch (error) {
                console.error('Failed to initialize Firebase Admin:', error);
                throw error;
            }
        })();

        await this.initializationPromise;
    }

    get admin() {
        if (!this._admin) throw new Error('Firebase Admin not initialized');
        return this._admin;
    }

    get database() {
        if (!this._database) throw new Error('Realtime Database not initialized');
        return this._database;
    }

    get firestore() {
        if (!this._firestore) throw new Error('Firestore not initialized');
        return this._firestore;
    }

    get auth() {
        if (!this._auth) throw new Error('Auth not initialized');
        return this._auth;
    }
}

const firebaseAdminService = FirebaseAdminService.getInstance();

// Export the initialization function
export const initializeFirebaseAdmin = () => firebaseAdminService.initialize();

// Export getter functions for the services
export const getFirebaseAdmin = () => firebaseAdminService.admin;
export const getDatabase = () => firebaseAdminService.database;
export const getFirestore = () => firebaseAdminService.firestore;
export const getAuth = () => firebaseAdminService.auth;

// For compatibility with existing code, you can also export these aliases
export const firebaseAdmin = getFirebaseAdmin;
export const databaseAdmin = getDatabase;
export const firestoreAdmin = getFirestore;
export const authAdmin = getAuth;


// import admin from 'firebase-admin';
// import * as dotenv from 'dotenv';
// import path from "path";
// import {SecureCredentialsManager} from "./credential.manager";
//
// const isProd = process.env.NODE_ENV === 'production';
//
// async function initializeFirebaseAdmin() {
//     try {
//         // Get credentials from secure storage
//         const serviceAccount = await SecureCredentialsManager.loadCredentials();
//
//         if (!serviceAccount) {
//             throw new Error('Failed to load Firebase credentials');
//         }
//
//         // Initialize Firebase Admin
//         if (!admin.apps.length) {
//             admin.initializeApp({
//                 credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//                 databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
//             });
//             console.log('[FirebaseAdmin] initialized for project', serviceAccount.project_id);
//         }
//     } catch (error) {
//         console.error('Failed to initialize Firebase Admin:', error);
//         throw error;
//     }
// }
//
// // Initialize without top-level await
// let firebaseAdmin: typeof admin;
// let firestoreAdmin: admin.firestore.Firestore;
// let authAdmin: admin.auth.Auth;
//
// // Initialize and export the promise for others to wait on if needed
// export const initializationPromise = initializeFirebaseAdmin().then(() => {
//     firebaseAdmin = admin;
//     firestoreAdmin = admin.firestore();
//     authAdmin = admin.auth();
// }).catch(error => {
//     console.error('Failed to initialize Firebase Admin:', error);
//     throw error;
// });
//
// export { firebaseAdmin, firestoreAdmin, authAdmin };


// const envPath = isProd
//     ? path.join(__dirname, 'app', '.env.prod')
//     : path.resolve(process.cwd(), '.env');
//
// console.log('Loading environment from:', envPath);
//
// dotenv.config({path: envPath, debug: !isProd});
//
// // Add debug logging
// console.log('Environment variables loaded:', {
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     type: process.env.FIREBASE_TYPE,
//     client_email: process.env.FIREBASE_CLIENT_EMAIL
// });
//
//
// // Build a proper service‑account object from env vars
// const serviceAccount = {
//     type: process.env.FIREBASE_TYPE,
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     client_id: process.env.FIREBASE_CLIENT_ID,
//     auth_uri: process.env.FIREBASE_AUTH_URI,
//     token_uri: process.env.FIREBASE_TOKEN_URI,
//     auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
//     client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
// };
//
// if (!serviceAccount.project_id) {
//     throw new Error('Missing required FIREBASE_PROJECT_ID environment variable');
// }
//
// // Initialize once
// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//         projectId: serviceAccount.project_id,
//         databaseURL: process.env.FIREBASE_DATABASE_URL,
//     });
//     console.log('[FirebaseAdmin] initialized for project', serviceAccount.project_id);
// }

// export const firebaseAdmin = admin;
// export const firestoreAdmin = admin.firestore();
// export const authAdmin = admin.auth();
