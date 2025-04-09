import { TestBed } from '@angular/core/testing';

import { UiThemeService } from './ui-theme.service';

describe('UiThemeService', () => {
  let service: UiThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
