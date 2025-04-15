import {createStore, withProps, select, filterNil} from '@ngneat/elf';
import { Injectable } from '@angular/core';
import {AppearanceSetting, PrimeTheme} from '../electron';

export interface SettingsProps {
  appearance: AppearanceSetting;
  theme: PrimeTheme;
}

const initialState: SettingsProps = {
  appearance: 'system',
  theme: 'aura',
};

@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private store = createStore({ name: 'settings' }, withProps<SettingsProps>(initialState));

  currentTheme$ = this.store.pipe(
    filterNil(),
    select(state => state.theme)
  );

  currentAppearance$ = this.store.pipe(
    filterNil(),
    select(state => state.appearance)
  );

  // Appearance CRUD operations
  getAppearance() {
    return this.store.pipe(select(state => state.appearance));
  }

  setAppearance(appearance: AppearanceSetting) {
    this.store.update(state => ({
      ...state,
      appearance
    }));
  }

  // Theme CRUD operations
  getTheme() {
    return this.store.pipe(filterNil(), select(state => state.theme));
  }

  setTheme(theme: PrimeTheme) {
    this.store.update(state => ({
      ...state,
      theme
    }));
  }

  // Reset to initial state
  reset() {
    this.store.update(state => ({
      ...initialState
    }));
  }
}
