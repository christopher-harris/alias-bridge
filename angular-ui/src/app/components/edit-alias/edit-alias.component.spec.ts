import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAliasComponent } from './edit-alias.component';

describe('EditAliasComponent', () => {
  let component: EditAliasComponent;
  let fixture: ComponentFixture<EditAliasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAliasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAliasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
