import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { ContractModule } from '../../../models/contract/contract.module';
import { faCoffee, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { ToastrServiceService } from 'src/app/services/ToastrService/toastr-service.service';



@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css']
})
export class FormularioContratoComponent implements OnInit {
  faCoffee = faFileCirclePlus;
  contracts = []; // todos los contratos
  contratos: any[] = []
  contratosFiltrados: any[] = []
  contratoSeleccionado: any = null
  contratoForm: FormGroup | undefined
  cargando = false
  enviando = false
  terminoBusqueda = ""

  // Variables para manejo de archivos
  archivoSeleccionado: File | null = null
  nombreArchivo = ""
  errorArchivo = ""

  // Referencia al modal
  private modalRef: any

  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario()
    this.cargarContratos()
  }

  ngAfterViewInit() {
    // Obtener referencia al modal para poder cerrarlo programáticamente
    const modalElement = document.getElementById("contratoModal")
    if (modalElement) {
      this.modalRef = new Modal(modalElement)
    }
  }

  inicializarFormulario(): void {
    this.contratoForm = this.fb.group({
      clientName: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      description: ["", Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expirationDate: ["", Validators.required],
    })
  }

  cargarContratos(): void {
    this.cargando = true
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data
        this.contratosFiltrados = [...this.contratos]
        this.cargando = false
      },
      error: (error) => {
        console.error("Error al cargar contratos:", error)
        this.toastr.error("Error al cargar los contratos")
        this.cargando = false
      },
    })
  }

  abrirFormulario(): void {
    this.contratoSeleccionado = null
    this.contratoForm.reset({
      startDate: new Date().toISOString().substring(0, 10),
    })
    this.limpiarArchivo()
  }

  editarContrato(contrato: any): void {
    this.contratoSeleccionado = contrato
    this.contratoForm.patchValue({
      clientName: contrato.clientName,
      clientEmail: contrato.clientEmail,
      description: contrato.description,
      startDate: new Date(contrato.startDate).toISOString().substring(0, 10),
      expirationDate: new Date(contrato.expirationDate).toISOString().substring(0, 10),
    })

    // Si el contrato tiene un archivo PDF, mostrar su nombre
    if (contrato.archivoPdf && contrato.archivoPdf.nombre) {
      this.nombreArchivo = contrato.archivoPdf.nombre
    } else {
      this.limpiarArchivo()
    }
  }

  guardarContrato(): void {
    if (this.contratoForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.contratoForm.controls).forEach((key) => {
        this.contratoForm.get(key)?.markAsTouched()
      })
      return
    }

    this.enviando = true

    // Crear FormData para enviar datos y archivo
    const formData = new FormData()

    // Añadir datos del contrato como JSON
    formData.append("contratoData", JSON.stringify(this.contratoForm.value))

    // Añadir archivo PDF si existe
    if (this.archivoSeleccionado) {
      formData.append("archivoPdf", this.archivoSeleccionado)
    }

    if (this.contratoSeleccionado) {
      // Actualizar contrato existente
      this.contratoService.actualizarContrato(this.contratoSeleccionado._id, formData).subscribe({
        next: (contratoActualizado) => {
          // Actualizar el contrato en la lista
          const index = this.contratos.findIndex((c) => c._id === contratoActualizado._id)
          if (index !== -1) {
            this.contratos[index] = contratoActualizado
            this.contratosFiltrados = [...this.contratos]
          }

          this.toastr.success("Contrato actualizado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error) => {
          console.error("Error al actualizar contrato:", error)
          this.toastr.error("Error al actualizar el contrato")
          this.enviando = false
        },
      })
    } else {
      // Crear nuevo contrato
      this.contratoService.crearContrato(formData).subscribe({
        next: (nuevoContrato) => {
          this.contratos.push(nuevoContrato)
          this.contratosFiltrados = [...this.contratos]
          this.toastr.success("Contrato creado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error) => {
          console.error("Error al crear contrato:", error)
          this.toastr.error("Error al crear el contrato")
          this.enviando = false
        },
      })
    }
  }

  eliminarContrato(id: string): void {
    if (confirm("¿Está seguro de eliminar este contrato?")) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          this.contratos = this.contratos.filter((c) => c._id !== id)
          this.contratosFiltrados = [...this.contratos]
          this.toastr.success("Contrato eliminado correctamente")
        },
        error: (error) => {
          console.error("Error al eliminar contrato:", error)
          this.toastr.error("Error al eliminar el contrato")
        },
      })
    }
  }

  verContrato(contrato: any): void {
    // Implementar lógica para ver detalles del contrato
    // Puedes usar un modal diferente o una página de detalles
  }

  // Métodos para manejo de archivos
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
        this.toastr.error("Error al descargar el PDF")
      },
    })
  }

  // Métodos para filtrar y clasificar contratos
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

  getEstadoTexto(contrato: any): string {
    const hoy = new Date()
    const fechaVencimiento = new Date(contrato.expirationDate)

    // Calcular días restantes
    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) {
      return "Vencido"
    } else if (diasRestantes <= 30) {
      return "Por vencer"
    } else {
      return "Activo"
    }
  }

  getEstadoClase(contrato: any): string {
    const estado = this.getEstadoTexto(contrato)

    switch (estado) {
      case "Vencido":
        return "bg-danger"
      case "Por vencer":
        return "bg-warning text-dark"
      case "Activo":
        return "bg-success"
      default:
        return "bg-secondary"
    }
  }

  // Método para filtrar contratos por pestañas
  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => this.getEstadoTexto(contrato) === estado)
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    if (this.modalRef) {
      this.modalRef.hide()
    }
  }
}
