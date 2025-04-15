import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { LocalAliasesEffects } from './local-aliases.effects';

describe('LocalAliasesEffects', () => {
  let actions$: Observable<any>;
  let effects: LocalAliasesEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocalAliasesEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(LocalAliasesEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
