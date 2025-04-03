import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarwinSetupInstructionsComponent } from './darwin-setup-instructions.component';

describe('DarwinSetupInstructionsComponent', () => {
  let component: DarwinSetupInstructionsComponent;
  let fixture: ComponentFixture<DarwinSetupInstructionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarwinSetupInstructionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DarwinSetupInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
