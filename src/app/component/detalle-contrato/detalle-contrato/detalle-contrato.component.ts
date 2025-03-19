import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { ContractModule } from 'src/app/models/contract/contract.module';
import { ClienteService } from 'src/app/services/Cliente/cliente.service';
import { ContractoService } from 'src/app/services/contracto/contracto.service';

@Component({
  selector: 'app-detalle-contrato',
  templateUrl: './detalle-contrato.component.html',
  styleUrls: ['./detalle-contrato.component.css']
})
export class DetalleContratoComponent  implements OnInit{
@Input() cargando: boolean = false;
contrato: any = {}
contratos: any[] = []
id = 0
estados: string[] = ["Activo", "Por vencer", "Vencido"]
estadoSeleccionado = "Activo"
fechaActual: Date = new Date()
fechaVencimiento: Date = new Date()
mostrarAlerta = false
tipoAlerta = "success"
mensajeAlerta = ""
diasRestantes = 0
mostrarModal = false
esExitoso = false
terminoBusqueda = ""
contratoOriginal: any = {}
contratoSeleccionado: any = null
contratoForm!: FormGroup
clients: any[] = []
contratosFiltrados: any[] = []
enviando = false
errorArchivo = ""
nombreArchivo = ""
archivoSeleccionado: File | null = null
  route: any;

  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
    private clientService: ClienteService,
    private datePipe: DatePipe,
  ) {
    this.contratoForm = this.fb.group({
      clientId: ["", Validators.required],
      clientName: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      contractNumber: ["", Validators.required],
      description: ["", Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expirationDate: ["", Validators.required],
      contractType: ["local", Validators.required],
      owner: ["ssv", Validators.required],
      serviceType: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params["id"]
    this.obtenerContrato()
    this.cargarContratos()
    this.cargarClientes()
  }

  obtenerContrato(): void {
    this.contratoService.getContrato(this.id.toString()).subscribe(
      (data: ContractModule) => {
        this.contrato = data
        this.contratoOriginal = { ...data }
        this.fechaVencimiento = new Date(this.contrato.expirationDate)
        this.diasRestantes = this.calcularDiasRestantes(this.fechaVencimiento)
      },
      (err: HttpErrorResponse) => {
        console.error(err)
      },
    )
  }

  cargarContratos(): void {
    this.contratoService.getContratos().subscribe(
      (data: ContractModule[]) => {
        this.contratos = data
        this.ordenarContratosPorEstado()
      },
      (error: HttpErrorResponse) => {
        console.error("Error al cargar los contratos:", error)
      },
    )
  }

  cargarClientes(): void {
    this.clientService.getClients().subscribe(
      (data: any[]) => {
        this.clients = data
      },
      (error: HttpErrorResponse) => {
        console.error("Error al cargar los clientes:", error)
      },
    )
  }

  abrirFormulario(): void {
    this.contratoSeleccionado = null
    this.contratoForm.reset({
      startDate: new Date().toISOString().substring(0, 10),
    })
    this.limpiarArchivo()
  }

  calcularDiasRestantes(fechaVencimiento: Date): number {
    const hoy = new Date()
    const diferenciaEnMilisegundos = fechaVencimiento.getTime() - hoy.getTime()
    const diferenciaEnDias = Math.ceil(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24))
    return diferenciaEnDias
  }

  getEstadoTexto(contrato: ContractModule): string {
    const fechaVencimiento = new Date(contrato.expirationDate)
    const diasRestantes = this.calcularDiasRestantes(fechaVencimiento)

    if (diasRestantes < 0) {
      return "Vencido"
    } else if (diasRestantes <= 30) {
      return "Por vencer"
    } else {
      return "Activo"
    }
  }

  ordenarContratosPorEstado(): void {
    this.contratos.sort((a, b) => {
      const estadoA = this.getEstadoTexto(a)
      const estadoB = this.getEstadoTexto(b)
      const prioridad: Record<string, number> = {
        Activo: 1,
        "Por vencer": 2,
        Vencido: 3,
      }
      return (prioridad[estadoA] || 999) - (prioridad[estadoB] || 999)
    })
  }

  filtrarContratos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.contratosFiltrados = [...this.contratos]
      return
    }
    const termino = this.terminoBusqueda.toLowerCase().trim()
    this.contratosFiltrados = this.contratos.filter(
      (contrato) =>
        contrato.clientName.toLowerCase().includes(termino) ||
        contrato.description.toLowerCase().includes(termino) ||
        contrato.clientEmail.toLowerCase().includes(termino),
    )
  }


  getContractTypeName(type: string): string {
    const types: Record<string, string> = {
      local: "Local",
      internacional: "Internacional",
      aseguradora: "Aseguradora",
    }
    return types[type] || type
  }

  getOwnerName(owner: string): string {
    const owners: Record<string, string> = {
      ssv: "SSV",
      klarida: "Klarida",
      abrah: "Abrah",
      softexpert: "Softexpert",
    }
    return owners[owner] || owner
  }

  eliminarContrato(id: string): void {
    if (confirm("¿Está seguro de eliminar este contrato?")) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          this.contratos = this.contratos.filter((c) => c._id !== id)
          this.mostrarModal = true
          this.mensajeAlerta = "Contrato eliminado correctamente"
          this.esExitoso = true
        },
        error: (error) => {
          console.error("Error al eliminar contrato:", error)
          this.mostrarModal = true
          this.mensajeAlerta = "Error al eliminar el contrato"
          this.esExitoso = false
        },
      })
    }
  }

  verContrato(contrato: any): void {
    this.contratoSeleccionado = contrato
  }

  editarContrato(id: string): void {
    this.contratoService.getContrato(id).subscribe({
      next: (contrato) => {
        this.contratoSeleccionado = contrato
        this.contratoForm.patchValue({
          clientId: contrato.clientId || "",
          clientName: contrato.clienteNombre || contrato.clientName,
          clientEmail: contrato.clienteEmail || contrato.clientEmail,
          contractNumber: contrato.numeroContrato || contrato.contractNumber,
          description: contrato.descripcion || contrato.description,
          startDate: new Date(contrato.fechaInicio || contrato.startDate).toISOString().substring(0, 10),
          expirationDate: new Date(contrato.fechaVencimiento || contrato.expirationDate).toISOString().substring(0, 10),
          contractType: contrato.contractType || "local",
          owner: contrato.owner || "ssv",
          serviceType: contrato.serviceType || "",
        })

        if (contrato.archivoPdf && contrato.archivoPdf.nombre) {
          this.nombreArchivo = contrato.archivoPdf.nombre
        } else {
          this.limpiarArchivo()
        }
      },
      error: (error) => {
        console.error("Error al cargar el contrato:", error)
        this.mostrarModal = true
        this.mensajeAlerta = "Error al cargar el contrato"
        this.esExitoso = false
      },
    })
  }
  onClientChange(event: any): void {
    const clientId = event.target.value
    if (clientId) {
      const selectedClient = this.clients.find((c) => c._id === clientId)
      if (selectedClient) {
        this.contratoForm.patchValue({
          clientName: selectedClient.name,
          clientEmail: selectedClient.email,
        })
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {
      // Verificar que sea un PDF
      if (file.type !== "application/pdf") {
        this.errorArchivo = "Solo se permiten archivos PDF"
        this.archivoSeleccionado = null
        this.nombreArchivo = ""
        return
      }

      // Verificar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorArchivo = "El archivo no debe superar los 5MB"
        this.archivoSeleccionado = null
        this.nombreArchivo = ""
        return
      }

      this.archivoSeleccionado = file
      this.nombreArchivo = file.name
      this.errorArchivo = ""
    }
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado = null
    this.nombreArchivo = ""
    this.errorArchivo = ""
    // Limpiar el input file
    const fileInput = document.getElementById("archivoPdf") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  tienePdf(contrato: any): boolean {
    return contrato.archivoPdf && contrato.archivoPdf.nombre
  }


  
  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => this.getEstadoTexto(contrato) === estado)
  }


  descargarPdf(id: string, nombreCliente: string): void {
    this.contratoService.descargarPdf(id).subscribe({
      next: (blob) => {
        // Crear URL del objeto blob
        const url = window.URL.createObjectURL(blob)

        // Crear elemento <a> para descargar
        const a = document.createElement("a")
        a.href = url
        a.download = `contrato-${nombreCliente}.pdf`
        document.body.appendChild(a)
        a.click()

        // Limpiar
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      },
      error: (error) => {
        console.error("Error al descargar PDF:", error)
        this.mostrarModal = true
        this.mensajeAlerta = "Error al descargar el PDF"
        this.esExitoso = false
      },
    })
  }

  verContratoAnterior(contrato: any): void {
    if (contrato.previousContractPath) {
      window.open(contrato.previousContractPath, "_blank")
    } else {
      this.mostrarModal = true
      this.mensajeAlerta = "No hay contrato anterior disponible"
      this.esExitoso = false
    }
  }


  onUpdate(): void {
    // Formatea la fecha antes de enviarla al backend
    if (this.contrato.fechaVencimiento) {
      this.contrato.fechaVencimiento = this.datePipe.transform(this.contrato.expirationDate, "yyyy-MM-dd") || ""
    }

    // Changed from update to actualizarContrato
    this.contratoService.actualizarContrato(this.contrato._id, this.contrato).subscribe(
      (data: any) => {
        this.mostrarModal = true
        this.mensajeAlerta = "Contrato actualizado exitosamente."
        this.esExitoso = true
        this.cargarContratos()
        this.obtenerContrato()
      },
      (err: any) => {
        this.mostrarModal = true
        this.mensajeAlerta = "Error al actualizar el contrato."
        this.esExitoso = false
        this.contrato = { ...this.contratoOriginal }
        this.obtenerContrato()
      },
    )
  }

  guardarContrato(): void {
    if (this.contratoForm.invalid) {

      Object.keys(this.contratoForm.controls).forEach((key) => {
        this.contratoForm.get(key)?.markAsTouched()
      })
      return
    }

    this.enviando = true
    const formData = new FormData()

    formData.append("contratoData", JSON.stringify(this.contratoForm.value))

    if (this.archivoSeleccionado) {
      formData.append("archivoPdf", this.archivoSeleccionado)
    }

    if (this.contratoSeleccionado) {
      this.contratoService.actualizarContrato(this.contratoSeleccionado._id, formData).subscribe({
        next: (contratoActualizado: { _id: any; }) => {
          const index = this.contratos.findIndex((c) => c._id === contratoActualizado._id)
          if (index !== -1) {
            this.contratos[index] = contratoActualizado
            this.contratosFiltrados = [...this.contratos]
          }

          this.mostrarMensaje("success", "Contrato actualizado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error: any) => {
          console.error("Error al actualizar contrato:", error)
          this.mostrarMensaje("danger", "Error al actualizar el contrato")
          this.enviando = false
        },
      })
    } else {
      this.contratoService.crearContrato(formData).subscribe({
        next: (nuevoContrato: any) => {
          this.contratos.push(nuevoContrato)
          this.contratosFiltrados = [...this.contratos]
          this.mostrarMensaje("success", "Contrato creado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error: any) => {
          console.error("Error al crear contrato:", error)
          this.mostrarMensaje("danger", "Error al crear el contrato")
          this.enviando = false
        },
      })
    }
  }
  mostrarMensaje(tipo: string, mensaje: string): void {
    this.tipoAlerta = tipo
    this.mensajeAlerta = mensaje
    this.mostrarAlerta = true
    setTimeout(() => {
      this.mostrarAlerta = false
    }, 5000)
  }


  cerrarModal(): void {
    this.mostrarModal = false
  }

  cancelarEdicion(): void {
    this.contrato = { ...this.contratoOriginal }
    this.obtenerContrato()
  }
}
