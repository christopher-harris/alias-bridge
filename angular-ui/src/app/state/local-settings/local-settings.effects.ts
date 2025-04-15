import {inject, Injectable} from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { LocalSettingsActions } from './local-settings.actions';
import {SettingsService} from '../../services/settings.service';
import {exhaustMap} from 'rxjs';


@Injectable()
export class LocalSettingsEffects {
  actions$ = inject(Actions);
  settingsService = inject(SettingsService);

  loadLocalSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalSettingsActions.loadLocalSettings),
      // exhaustMap(action => this.settingsService),
      // concatMap(() =>
      //   /** An EMPTY observable only emits completion. Replace with your own observable API request */
      //   EMPTY.pipe(
      //     map(data => LocalSettingsActions.loadLocalSettingssSuccess({ data })),
      //     catchError(error => of(LocalSettingsActions.loadLocalSettingssFailure({ error }))))
      // )
    );
  }, {dispatch: false});

  themeSelected$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalSettingsActions.updateTheme),
      exhaustMap(action => this.settingsService.setPrimeThemePreference(action.theme))
    );
  }, {dispatch: false});

  appearanceSelected$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalSettingsActions.updateAppearance),
      exhaustMap(action => this.settingsService.setAppearancePreference(action.appearance))
    );
  }, {dispatch: false});

}
