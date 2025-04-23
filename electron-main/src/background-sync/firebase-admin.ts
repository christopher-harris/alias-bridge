import admin from 'firebase-admin';

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
