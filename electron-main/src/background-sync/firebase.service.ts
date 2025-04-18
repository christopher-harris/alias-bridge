import {FirebaseApp, initializeApp} from 'firebase/app';
import {getFirestore, collection, getDocs, setDoc, doc, onSnapshot, Firestore} from 'firebase/firestore';
import {Auth, getAuth} from "firebase/auth";
import admin from "firebase-admin";

const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // fix line breaks
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
});

export class FirebaseService {
    private app: FirebaseApp | undefined;
    private db: Firestore | undefined;
    private auth: Auth | undefined;

    constructor(private config: any) {}

    init() {
        this.app = initializeApp(this.config);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
    }

    get firestore() {
        if (!this.db) {
            throw new Error('Firestore has not been initialized.');
        }
        return this.db;
    }

    get authentication() {
        if (!this.auth) {
            throw new Error('Authentication has not been initialized.');
        }
        return this.auth;
    }
}
