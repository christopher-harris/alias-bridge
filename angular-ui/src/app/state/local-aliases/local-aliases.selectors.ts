import { createFeatureSelector, createSelector } from '@ngrx/store';
import {localAliasesFeatureKey, LocalAliasesState, selectAll} from './local-aliases.reducer';

export const aliasesFeature = createFeatureSelector<LocalAliasesState>(localAliasesFeatureKey);

export const selectLocalAliases = createSelector(
  aliasesFeature,
  (state) => selectAll(state)
);
