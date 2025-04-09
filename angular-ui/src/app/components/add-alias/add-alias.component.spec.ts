import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAliasComponent } from './add-alias.component';

describe('EditAliasComponent', () => {
  let component: AddAliasComponent;
  let fixture: ComponentFixture<AddAliasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAliasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAliasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
