import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaContratosComponent } from './lista-contratos.component';

describe('ListaContratosComponent', () => {
  let component: ListaContratosComponent;
  let fixture: ComponentFixture<ListaContratosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListaContratosComponent]
    });
    fixture = TestBed.createComponent(ListaContratosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
