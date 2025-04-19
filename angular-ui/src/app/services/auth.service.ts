import {inject, Injectable} from '@angular/core';
import {
  Auth,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import {FirebaseService} from './firebase.service';
import {AppUser} from '../models/app-user.model';
import {Store} from '@ngrx/store';
import {AuthActions} from '../state/app/auth/auth.actions';
import {FirebaseError} from 'firebase-admin';

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
        window.electronAPI.authenticateWithGitHub({user: appUser, token: idToken});
        this.store.dispatch(AuthActions.authSuccess({ data: appUser }));
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

  async registerWithEmail(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await sendEmailVerification(userCredential.user);
      console.log('Email Verification Sent', userCredential.user.email);
      // this.store.dispatch(AuthActions.registerEmailUserSuccess({data: userCredential.user}))
    } catch (error: any) {
      console.error('Email Registration Error:', error.code, error.message);
      this.store.dispatch(AuthActions.registerEmailUserFailed({error: (error as FirebaseError).message}));
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Email Sign-In Success:', userCredential.user.email);
      // this.store.dispatch(AuthActions.signInEmailUserSuccess({data: userCredential.user}));
    } catch (error: any) {
      console.error('Email Sign-In Error:', error.code, error.message);
      this.store.dispatch(AuthActions.signInEmailUserFailed({error: error as FirebaseError}))
    }
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.auth, email);
    console.log('Password Reset Email Sent');
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
