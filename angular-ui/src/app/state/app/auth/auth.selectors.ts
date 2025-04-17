import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAuth from './auth.reducer';
import {AuthState} from './auth.reducer';

export const selectAuthState = createFeatureSelector<fromAuth.AuthState>(
  fromAuth.authFeatureKey
);

export const selectAppUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.appUser
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.authenticated
);

export const selectIsAuthenticating = createSelector(
  selectAuthState,
  (state: AuthState) => state.authenticating
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);
