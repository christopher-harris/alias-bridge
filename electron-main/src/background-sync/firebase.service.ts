import {FirebaseApp, initializeApp} from 'firebase/app';
import {getFirestore, collection, getDocs, setDoc, doc, onSnapshot, Firestore} from 'firebase/firestore';
import {Auth, getAuth} from "firebase/auth";

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
