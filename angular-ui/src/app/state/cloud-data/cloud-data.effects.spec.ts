import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { CloudDataEffects } from './cloud-data.effects';

describe('CloudDataEffects', () => {
  let actions$: Observable<any>;
  let effects: CloudDataEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CloudDataEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(CloudDataEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
