import {createFeature, createReducer, createSelector, on} from '@ngrx/store';
import { LocalSettingsActions } from './local-settings.actions';
import {AppearanceSetting, PrimeTheme} from '../../electron';

export const localSettingsFeatureKey = 'localSettings';

export interface State {
  appearance: AppearanceSetting;
  theme: PrimeTheme;
}

export const initialState: State = {
  appearance: 'system',
  theme: 'aura',
};

export const reducer = createReducer(
  initialState,
  on(LocalSettingsActions.loadLocalSettings, state => state),
  on(LocalSettingsActions.loadLocalSettingsSuccess, (state, action) => state),
  on(LocalSettingsActions.loadLocalSettingsFailure, (state, action) => state),
  on(LocalSettingsActions.updateAppearance, (state, {appearance}) => ({...state, appearance})),
  on(LocalSettingsActions.updateTheme, (state, {theme}) => ({...state, theme})),
);

export const localSettingsFeature = createFeature({
  name: localSettingsFeatureKey,
  reducer,
  extraSelectors: ({selectAppearance, selectTheme}) => ({
    selectCurrentAppearance: selectAppearance,
    selectCurrentTheme: selectTheme
  })
});

