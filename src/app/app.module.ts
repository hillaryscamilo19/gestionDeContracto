import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { HttpClientModule } from "@angular/common/http"
import { FormsModule } from "@angular/forms"

import { AppRoutingModule } from "./app-routing.module"
import { AppComponent } from "./app.component"
import { ConfiguracionNotificacionesComponent } from "./component/configuracion-notificaciones/configuracion-notificaciones/configuracion-notificaciones.component"
import { DetalleContratoComponent } from "./component/detalle-contrato/detalle-contrato/detalle-contrato.component"
import { FormularioContratoComponent } from "./component/formulario-contrato/formulario-contrato/formulario-contrato.component"
import { ListaContratosComponent } from "./component/lista-contratos/lista-contratos/lista-contratos.component"


@NgModule({
  declarations: [
    AppComponent,
    ListaContratosComponent,
    FormularioContratoComponent,
    DetalleContratoComponent,
    ConfiguracionNotificacionesComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
