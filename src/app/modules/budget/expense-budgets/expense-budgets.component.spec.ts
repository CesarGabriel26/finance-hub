import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseBudgetsComponent } from './expense-budgets.component';

describe('ExpenseBudgetsComponent', () => {
  let component: ExpenseBudgetsComponent;
  let fixture: ComponentFixture<ExpenseBudgetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseBudgetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseBudgetsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
