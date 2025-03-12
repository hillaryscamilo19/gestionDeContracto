import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionNotificacionesComponent } from './configuracion-notificaciones.component';

describe('ConfiguracionNotificacionesComponent', () => {
  let component: ConfiguracionNotificacionesComponent;
  let fixture: ComponentFixture<ConfiguracionNotificacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfiguracionNotificacionesComponent]
    });
    fixture = TestBed.createComponent(ConfiguracionNotificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
