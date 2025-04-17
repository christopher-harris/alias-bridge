import {createFeature, createReducer, on} from '@ngrx/store';
import {AuthActions} from './auth.actions';
import {AppUser} from '../../../models/app-user.model';

export const authFeatureKey = 'auth';

export interface AuthState {
  appUser: AppUser | null;
  authenticating: boolean;
  authenticated: boolean;
  error: any | null;
}

export const initialState: AuthState = {
  appUser: null,
  authenticating: false,
  authenticated: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.userClickedGitHubAuth, state => ({...state, authenticating: true})),
  on(AuthActions.gitHubAuthSuccess, (state, action) => ({
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
);

export const authFeature = createFeature({
  name: authFeatureKey,
  reducer,
});

