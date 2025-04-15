import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {getFirestore, Firestore, doc, setDoc} from 'firebase/firestore';
import {environment} from '../../environments/environment';
import {Alias} from '../electron';

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
}
