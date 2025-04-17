import {inject, Injectable} from '@angular/core';
import {
  Auth,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import {FirebaseService} from './firebase.service';
import {AppUser} from '../models/app-user.model';
import {Store} from '@ngrx/store';
import {AuthActions} from '../state/app/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  store = inject(Store);
  private auth: Auth;

  constructor(private firebaseService: FirebaseService) {
    this.auth = this.firebaseService.auth;

    onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
      let appUser: AppUser | null;
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        appUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        // Initialize user data when user signs in
        // this.store.dispatch(CloudDataActions.userLoggedInSuccess({ data: appUser }));
        window.electronAPI.authenticateWithGitHub({user: appUser, token: idToken});
        this.store.dispatch(AuthActions.gitHubAuthSuccess({ data: appUser }));
      } else {
        console.log('User Logged Out');
        this.store.dispatch(AuthActions.userLoggedOut());
      }
    });
  }

  async signInWithGitHub(): Promise<User | null> {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      // User is already updated via onAuthStateChanged, but result.user has the immediate value
      console.log('GitHub Sign-In Success:', result.user.displayName);
      return result.user;
    } catch (error: any) {
      console.error('GitHub Sign-In Error:', error.code, error.message);
      // Handle specific errors if needed (e.g., account exists with different credential)
      // You might want to show a user-friendly message via a snackbar/toast service
      return null; // Indicate failure
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      // User state is updated via onAuthStateChanged
      console.log('Sign Out Success');
    } catch (error) {
      console.error('Sign Out Error:', error);
      // Show user-friendly error
    }
  }
}
