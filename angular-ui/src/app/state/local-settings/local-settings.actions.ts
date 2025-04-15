import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {AppearanceSetting, PrimeTheme} from '../../electron';

export const LocalSettingsActions = createActionGroup({
  source: 'LocalSettings',
  events: {
    'Load LocalSettings': emptyProps(),
    'Load LocalSettings Success': props<{ data: unknown }>(),
    'Load LocalSettings Failure': props<{ error: unknown }>(),
    'Update Appearance': props<{ appearance: AppearanceSetting }>(),
    'Update Theme': props<{ theme: PrimeTheme }>(),
  }
});
