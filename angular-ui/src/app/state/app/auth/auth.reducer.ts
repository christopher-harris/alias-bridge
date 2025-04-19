import {createFeature, createReducer, on} from '@ngrx/store';
import {AuthActions} from './auth.actions';
import {AppUser} from '../../../models/app-user.model';
import {FirebaseError} from 'firebase-admin';

export const authFeatureKey = 'auth';

export interface AuthState {
  appUser: AppUser | null;
  authenticating: boolean;
  authenticated: boolean;
  registeringUser: boolean;
  error: any | null | FirebaseError;
}

export const initialState: AuthState = {
  appUser: null,
  authenticating: false,
  authenticated: false,
  registeringUser: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.userClickedGitHubAuth, state => ({...state, authenticating: true})),
  on(AuthActions.authSuccess, (state, action) => ({
    ...state,
    appUser: action.data,
    authenticating: false,
    authenticated: true
  })),
  on(AuthActions.gitHubAuthFailure, (state, action) => ({
    ...state,
    authenticating: false,
    authenticated: false,
    error: action.error
  })),
  on(AuthActions.userLoggedOut, state => ({...state, appUser: null, authenticated: false})),
  on(AuthActions.registerEmailUser, (state, action) => ({...state, registeringUser: true})),
  on(AuthActions.registerEmailUserSuccess, (state, action) => ({
    ...state,
    appUser: action.data,
    registeringUser: false,
    authenticated: true,
    error: null,
  })),
  on(AuthActions.registerEmailUserFailed, (state, action) => ({
    ...state,
    registeringUser: false,
    error: action.error,
  })),
  on(AuthActions.signInEmailUser, (state, action) => ({...state, authenticating: true})),
  on(AuthActions.signInEmailUserSuccess, (state, action) => ({
    ...state,
    appUser: action.data,
    authenticating: false,
    authenticated: true,
    error: null,
  })),
  on(AuthActions.signInEmailUserFailed, (state, action) => ({
    ...state,
    authenticating: false,
    error: action.error,
  }))
);

export const authFeature = createFeature({
  name: authFeatureKey,
  reducer,
});

