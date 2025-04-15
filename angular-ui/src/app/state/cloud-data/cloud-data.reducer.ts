import {createFeature, createReducer, on} from '@ngrx/store';
import {EntityState, EntityAdapter, createEntityAdapter} from '@ngrx/entity';
import {Alias, AppearanceSetting, PrimeTheme} from '../../electron';
import {AppUser} from '../../models/app-user.model';
import {CloudDataActions} from './cloud-data.actions';

export const cloudDataFeatureKey = 'cloudData';

export interface State extends EntityState<Alias> {
  // additional entities state properties
  settings: {
    appearance: AppearanceSetting;
    theme: PrimeTheme;
  },
  appUser: AppUser | null;
  syncing: boolean;
  loaded: boolean;
  error: any | null;
}

export const adapter: EntityAdapter<Alias> = createEntityAdapter<Alias>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
  settings: {
    appearance: 'system',
    theme: 'aura'
  },
  appUser: null,
  syncing: false,
  loaded: false,
  error: null,
});

export const reducer = createReducer(
  initialState,
  on(CloudDataActions.userLoggedInSuccess, (state, action) => (
    {
      ...state,
      appUser: action.data,
      syncing: true,
    }
  )),
  on(CloudDataActions.userCloudDataLoaded, (state, action) => {
    console.log(action.data);
    return adapter.setAll(
      action.data.aliases,
      {...state, syncing: false}
    );
  }),
  on(CloudDataActions.updateAliases, (state, action) => {
    console.log(action.data);
    return adapter.setAll(action.data, {...state, syncing: true});
  }),
  on(CloudDataActions.updateSettings, (state, action) => ({
    ...state,
    settings: action.data,
    syncing: true,
  })),
  on(CloudDataActions.saveCloudAliasesSuccess, (state, action) => ({
    ...state,
    syncing: false,
  })),
  on(CloudDataActions.saveCloudAliasesFailure, (state, action) => ({
    ...state,
    syncing: false,
    error: action.error,
  })),
  on(CloudDataActions.userLoggedOut, (state, action) => ({
    ...state,
    appUser: null,
  }))
);

export const cloudDataFeature = createFeature({
  name: cloudDataFeatureKey,
  reducer,
  extraSelectors: ({selectCloudDataState}) => ({
    ...adapter.getSelectors(selectCloudDataState)
  }),
});

export const {
  selectCloudDataState
} = cloudDataFeature;

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors(selectCloudDataState);

export const selectAppUser = (state: State) => state.appUser;
export const selectSettings = (state: State) => state.settings;
export const selectSyncing = (state: State) => state.syncing;
export const selectLoaded = (state: State) => state.loaded;
export const selectError = (state: State) => state.error;
