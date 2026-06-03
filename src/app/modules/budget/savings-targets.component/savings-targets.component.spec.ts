import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingsTargetsComponent } from './savings-targets.component';

describe('SavingsTargetsComponent', () => {
  let component: SavingsTargetsComponent;
  let fixture: ComponentFixture<SavingsTargetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavingsTargetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavingsTargetsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
