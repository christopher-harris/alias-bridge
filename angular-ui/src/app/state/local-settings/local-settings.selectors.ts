import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromLocalSettings from './local-settings.reducer';

export const selectLocalSettingsState = createFeatureSelector<fromLocalSettings.State>(
  fromLocalSettings.localSettingsFeatureKey
);
