import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudStatusComponent } from './cloud-status.component';

describe('CloudStatusComponent', () => {
  let component: CloudStatusComponent;
  let fixture: ComponentFixture<CloudStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
