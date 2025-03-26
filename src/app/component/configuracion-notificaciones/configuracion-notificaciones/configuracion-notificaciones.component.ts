import { Component, type OnInit } from "@angular/core"
import { ConfiguracionService } from "src/app/services/configuracion/configuracion.service"


// Renombramos la interfaz para evitar conflictos con RTCConfiguration
interface NotificacionConfig {
  emailRemitente: string
  diasAnticipacion: number
  recordatoriosAdicionales: boolean
  frecuenciaRecordatorio: string
}

@Component({
  selector: "app-configuracion-notificaciones",
  templateUrl: "./configuracion-notificaciones.component.html",
  styleUrls: ["./configuracion-notificaciones.component.css"],
})
export class ConfiguracionNotificacionesComponent implements OnInit {
    // Usamos 'any' para evitar conflictos de tipos
    configuracion: any = {
      emailRemitente: "",
      diasAnticipacion: 30,
      recordatoriosAdicionales: true,
      frecuenciaRecordatorio: "semanal",
    }

    testEmailAddress = ""
    cargando = true
    guardando = false
    enviandoPrueba = false
    error = ""
    mensaje = ""

    // Errores de validación
    errors: { [key: string]: string } = {}

    constructor(private configuracionService: ConfiguracionService) {}

    ngOnInit(): void {
      this.cargarConfiguracion()
    }

    cargarConfiguracion(): void {

    }

    validarFormulario() {
    
    }

    validarEmail(email: string): boolean {
      const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      return re.test(email)
    }

    onSubmit(): void {
      console.log("onSubmit llamado")
      this.guardarConfiguracion()
    }

    guardarConfiguracion(): void {
     
    }

    validarEmailPrueba(): boolean {
      if (!this.testEmailAddress) {
        this.errors["testEmail"] = "El email es requerido"
        return false
      } else if (!this.validarEmail(this.testEmailAddress)) {
        this.errors["testEmail"] = "Ingrese un email válido"
        return false
      }
      return true
    }

    enviarCorreoPrueba(): void {
    }
}

