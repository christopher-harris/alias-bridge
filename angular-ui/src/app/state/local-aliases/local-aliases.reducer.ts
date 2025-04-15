import {createFeature, createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { LocalAliasesActions } from './local-aliases.actions';
import {Alias} from '../../electron';

export const localAliasesFeatureKey = 'localAliases';

export interface State extends EntityState<Alias> {
  // additional entities state properties
  saving: boolean;
}

export const adapter: EntityAdapter<Alias> = createEntityAdapter<Alias>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
  saving: false,
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
  on(LocalAliasesActions.updateLocalAlias, (state, action) => adapter.updateOne(action.alias, state))
);

export const localAliasesFeature = createFeature({
  name: localAliasesFeatureKey,
  reducer,
  extraSelectors: ({ selectLocalAliasesState }) => ({
    ...adapter.getSelectors(selectLocalAliasesState),
    selectLocalAliases: createSelector(
      selectLocalAliasesState,
      (state) => state.entities
    ),
  }),
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = localAliasesFeature;
