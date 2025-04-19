import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {exhaustMap, tap} from 'rxjs';
import {AuthService} from '../../../services/auth.service';
import {AuthActions} from './auth.actions';


@Injectable()
export class AuthEffects {
  authService = inject(AuthService);
  actions$ = inject(Actions);

  initGithubAuth = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.userClickedGitHubAuth),
      exhaustMap(() => this.authService.signInWithGitHub())
    );
  }, {dispatch: false});

  logoutUser = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.userClickedLogOut),
      tap(() => {
        this.authService.signOut();
        window.electronAPI.logOut();
      })
    );
  }, {dispatch: false});

  registerNewUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.registerEmailUser),
      exhaustMap(action => this.authService.registerWithEmail(action.email, action.password))
    );
  }, {dispatch: false});

  signInEmailUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signInEmailUser),
      exhaustMap(action => this.authService.signInWithEmail(action.email, action.password))
    );
  }, {dispatch: false});

}
