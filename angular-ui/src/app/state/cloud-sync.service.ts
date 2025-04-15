import {inject, Injectable} from '@angular/core';
import {getFirestore, doc, setDoc, getDoc} from 'firebase/firestore';
import {Alias, AppearanceSetting, PrimeTheme} from '../electron';
import {FirebaseService} from '../services/firebase.service';
import {Store} from '@ngrx/store';
import {cloudDataFeature} from './cloud-data/cloud-data.reducer';
import {toSignal} from '@angular/core/rxjs-interop';
import {AppUser} from '../models/app-user.model';
import {filter, firstValueFrom, from, lastValueFrom, map, Observable, switchMap} from 'rxjs';
import {CloudData} from '../models/cloud-data.model';
import {localAliasesFeature} from './local-aliases/local-aliases.reducer';

@Injectable({
  providedIn: 'root'
})
export class CloudSyncService {
  firebaseService = inject(FirebaseService);
  store = inject(Store);

  private getUserIdFromStore(): Promise<string> {
    return firstValueFrom(this.store.select(cloudDataFeature.selectAppUser).pipe(
      filter(user => !!user),
      map(user => user.uid.valueOf())
    ));
  }

  get db() {
    return this.firebaseService.db;
  }

  saveUserCloudData(userId: string, data: { aliases: Alias[]; settings: { appearance: AppearanceSetting; theme: PrimeTheme } }) {
    console.log(userId, data);
    const docRef = doc(this.db, `users/${userId}`);
    return from(setDoc(docRef, {
      aliases: data.aliases,
      settings: data.settings
    }, { merge: true }));
  }

  // saveAliasesToFirestore(userId: string, aliases: Alias[]): Observable<void> {
  //   console.log('saveAliasesToFirestore', userId, aliases);
  //   const userDocRef = doc(this.firebaseService.db, `users/${userId}`);
  //   return from(setDoc(userDocRef, { aliases }, { merge: true }));
  // }

  saveAliasesToFirestore(userId: string): Observable<any> {
    console.log('saveAliasesToFirestore', userId);
    return this.store.select(localAliasesFeature.selectLocalAliases).pipe(
      switchMap(aliases => {
        console.log(aliases);
        const userDocRef = doc(this.firebaseService.db, `users/${userId}`);
        console.log(userDocRef);
        return from(setDoc(userDocRef, { aliases }, { merge: false }));
      })
    );
  }

  async loadUserDataFromFirestore(): Promise<CloudData | null> {
    const userID = await this.getUserIdFromStore();
    console.log(userID);

    if (!userID) {
      throw new Error('User not authenticated');
    }

    const userDocRef = doc(this.firebaseService.db, `users/${userID}`);
    console.log('userDocRef', userDocRef);
    const snapshot = await getDoc(userDocRef);
    console.log('snapshot', snapshot);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    console.log('data', data);
    // const aliases = (data.aliases as Alias[]).map(alias => ({
    //   ...alias,
    //   created: alias.created ? new Date(alias.created.seconds * 1000) : undefined,
    //   lastUpdated: alias.lastUpdated ? new Date(alias.lastUpdated.seconds * 1000) : undefined,
    // }));
    // console.log('aliases', aliases);

    return data as CloudData;
  }

}
