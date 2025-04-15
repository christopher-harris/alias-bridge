import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {getFirestore, Firestore, doc, getDoc} from 'firebase/firestore';
import {environment} from '../../environments/environment';
import {CloudData} from '../models/cloud-data.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    console.log('Firebase initialized successfully.');
  }

  async getUserCloudData(uid: string): Promise<CloudData | null> {
    const userDocRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as CloudData;
    } else {
      return null;
    }
  }
}
