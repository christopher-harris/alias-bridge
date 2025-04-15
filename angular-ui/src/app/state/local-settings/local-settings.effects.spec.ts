import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { LocalSettingsEffects } from './local-settings.effects';

describe('LocalSettingsEffects', () => {
  let actions$: Observable<any>;
  let effects: LocalSettingsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalSettingsEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(LocalSettingsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
