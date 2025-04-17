import { TestBed } from '@angular/core/testing';

import { ElectronListenerService } from './electron-listener.service';

describe('ElectronListenerService', () => {
  let service: ElectronListenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectronListenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
