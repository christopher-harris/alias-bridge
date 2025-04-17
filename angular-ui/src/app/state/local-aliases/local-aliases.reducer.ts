import {createFeature, createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {EntityState, EntityAdapter, createEntityAdapter} from '@ngrx/entity';
import {LocalAliasesActions} from './local-aliases.actions';
import {Alias} from '../../electron';

export const localAliasesFeatureKey = 'localAliases';

export interface LocalAliasesState extends EntityState<Alias> {
  // additional entities state properties
  saving: boolean;
  error: any | null;
}

export const adapter: EntityAdapter<Alias> = createEntityAdapter<Alias>();

export const initialState: LocalAliasesState = adapter.getInitialState({
  // additional entity state properties
  saving: false,
  error: null,
});

export const reducer = createReducer(
  initialState,
  on(LocalAliasesActions.addLocalAlias,
    (state, action) => adapter.addOne(action.alias, state)
  ),
  on(LocalAliasesActions.addLocalAliases,
    (state, action) => adapter.addMany(action.aliases, state)
  ),
  on(LocalAliasesActions.deleteLocalAlias, (state, action) => {
    return {...state, saving: true};
  }),
  on(LocalAliasesActions.localAliasDeleted, (state, action) => adapter.removeOne(action.id, {
    ...state,
    saving: false,
  })),
  on(LocalAliasesActions.updateLocalAlias, (state, action) => ({
    ...state,
    saving: true,
  })),
  on(LocalAliasesActions.updateLocalAliasSuccess, (state, action) => adapter.updateOne(action.alias, {
    ...state,
    saving: false
  })),
  on(LocalAliasesActions.updateLocalAliasFailed, (state, action) => ({
    ...state,
    saving: false,
    error: action.error,
  })),
  on(LocalAliasesActions.updateLocalAliases, (state, action) => adapter.upsertMany(action.aliases, state)),
);

export const localAliasesFeature = createFeature({
  name: localAliasesFeatureKey,
  reducer,
  extraSelectors: ({selectLocalAliasesState}) => ({
    ...adapter.getSelectors(selectLocalAliasesState),
  }),
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = localAliasesFeature;
