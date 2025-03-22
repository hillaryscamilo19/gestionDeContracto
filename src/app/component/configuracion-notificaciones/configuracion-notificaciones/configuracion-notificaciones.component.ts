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
      this.cargando = true
      this.configuracionService.getConfiguracion().subscribe({
        next: (data: any) => {
          if (data) {
            this.configuracion.emailRemitente = data.emailRemitente || ""
            this.configuracion.diasAnticipacion = data.diasAnticipacion || 30
            this.configuracion.recordatoriosAdicionales =
              data.recordatoriosAdicionales !== undefined ? data.recordatoriosAdicionales : true
            this.configuracion.frecuenciaRecordatorio = data.frecuenciaRecordatorio || "semanal"
          }
          this.cargando = false
        },
        error: (err: any) => {
          this.error = "Error al cargar la configuración"
          this.cargando = false
          console.error(err)
        },
      })
    }

    validarFormulario(): boolean {
      this.errors = {}
      let isValid = true
      // Validar email remitente
      if (!this.configuracion.emailRemitente) {
        this.errors["emailRemitente"] = "El email remitente es requerido"
        isValid = false
      } else if (!this.validarEmail(this.configuracion.emailRemitente)) {
        this.errors["emailRemitente"] = "Ingrese un email válido"
        isValid = false
      }
      // Validar días de anticipación
      if (!this.configuracion.diasAnticipacion) {
        this.errors["diasAnticipacion"] = "Los días de anticipación son requeridos"
        isValid = false
      } else if (this.configuracion.diasAnticipacion < 1) {
        this.errors["diasAnticipacion"] = "Ingrese un número válido mayor a 0"
        isValid = false
      }
      return isValid
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
      if (!this.validarFormulario()) {
        return
      }

      this.guardando = true
      this.mensaje = ""
      this.error = ""

      this.configuracionService.actualizarConfiguracion(this.configuracion).subscribe({
        next: () => {
          this.mensaje = "Configuración guardada exitosamente"
          this.guardando = false
        },
        error: (err: any) => {
          this.error = "Error al guardar la configuración"
          this.guardando = false
          console.error(err)
        },
      })
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
      this.errors = {}

      if (!this.validarEmailPrueba()) {
        return
      }

      this.enviandoPrueba = true
      this.mensaje = ""
      this.error = ""

      this.configuracionService.enviarCorreoPrueba(this.testEmailAddress).subscribe({
        next: () => {
          this.mensaje = "Correo de prueba enviado exitosamente"
          this.enviandoPrueba = false
        },
        error: (err: any) => {
          this.error = "Error al enviar correo de prueba"
          this.enviandoPrueba = false
          console.error(err)
        },
      })
    }
}

