import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupInfoComponent } from './setup-info.component';

describe('SetupInfoComponent', () => {
  let component: SetupInfoComponent;
  let fixture: ComponentFixture<SetupInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
