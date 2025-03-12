import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfiguracionNotificacionesComponent } from './component/configuracion-notificaciones/configuracion-notificaciones/configuracion-notificaciones.component';
import { DetalleContratoComponent } from './component/detalle-contrato/detalle-contrato/detalle-contrato.component';
import { FormularioContratoComponent } from './component/formulario-contrato/formulario-contrato/formulario-contrato.component';
import { ListaContratosComponent } from './component/lista-contratos/lista-contratos/lista-contratos.component';


const routes: Routes = [
  { path: '', redirectTo: '/contratos', pathMatch: 'full' },
  { path: 'contratos', component: ListaContratosComponent },
  { path: 'contratos/nuevo', component: FormularioContratoComponent },
  { path: 'contratos/editar/:id', component: FormularioContratoComponent },
  { path: 'contratos/:id', component: DetalleContratoComponent },
  { path: 'configuracion', component: ConfiguracionNotificacionesComponent },
  { path: '**', redirectTo: '/contratos' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
