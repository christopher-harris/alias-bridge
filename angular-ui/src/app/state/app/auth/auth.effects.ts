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

  // loadAuths$ = createEffect(() => {
  //   return this.actions$.pipe(
  //
  //     ofType(AuthActions.loadAuths),
  //     concatMap(() =>
  //       /** An EMPTY observable only emits completion. Replace with your own observable API request */
  //       EMPTY.pipe(
  //         map(data => AuthActions.loadAuthsSuccess({ data })),
  //         catchError(error => of(AuthActions.loadAuthsFailure({ error }))))
  //     )
  //   );
  // });

}
