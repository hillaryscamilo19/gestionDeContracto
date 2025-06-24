import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractoComponent } from './contracto.component';

describe('ContractoComponent', () => {
  let component: ContractoComponent;
  let fixture: ComponentFixture<ContractoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContractoComponent]
    });
    fixture = TestBed.createComponent(ContractoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
