import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Importa todos los componentes
import { AppComponent } from './app.component';
import { ListaContratosComponent } from './component/lista-contratos/lista-contratos/lista-contratos.component';
import { FormularioContratoComponent } from './component/formulario-contrato/formulario-contrato/formulario-contrato.component';
import { DetalleContratoComponent } from './component/detalle-contrato/detalle-contrato/detalle-contrato.component';
import { ConfiguracionNotificacionesComponent } from './component/configuracion-notificaciones/configuracion-notificaciones/configuracion-notificaciones.component';

// Importa los servicios
import { ContractoService } from './services/contracto/contracto.service';
import { ConfiguracionService } from './services/configuracion/configuracion.service';

@NgModule({
  declarations: [
    AppComponent,
    ListaContratosComponent,
    FormularioContratoComponent,
    DetalleContratoComponent,
    ConfiguracionNotificacionesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    RouterModule.forRoot([
      { path: '', redirectTo: '/contratos', pathMatch: 'full' },
      { path: 'contratos', component: ListaContratosComponent },
      { path: 'nuevo-contrato', component: FormularioContratoComponent },
      { path: 'editar-contrato/:id', component: FormularioContratoComponent },
      { path: 'detalle-contrato/:id', component: DetalleContratoComponent },
      { path: 'configuracion', component: ConfiguracionNotificacionesComponent }
    ])
  ],
  providers: [
    ContractoService,
    ConfiguracionService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }