import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowsSetupInstructionsComponent } from './windows-setup-instructions.component';

describe('WindowsSetupInstructionsComponent', () => {
  let component: WindowsSetupInstructionsComponent;
  let fixture: ComponentFixture<WindowsSetupInstructionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindowsSetupInstructionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindowsSetupInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
