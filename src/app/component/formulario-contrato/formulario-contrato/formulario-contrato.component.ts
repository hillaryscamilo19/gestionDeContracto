import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { Modal } from 'bootstrap';

declare var bootstrap: any;

@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css'],
})
export class FormularioContratoComponent implements OnInit {
  @Input() contratos: any[] = [];
  @Input() cargando: boolean = false;
  contratosFiltrados: any[] = []
  contratoSeleccionado: any = null
  pdfSeleccionado: File | null = null;
  contratoForm!: FormGroup;

  enviando = false
  terminoBusqueda = ""
  archivoSeleccionado: File | null = null
  nombreArchivo = ""
  pdfSrc: string | null = null;
  cargandoPdf: boolean = false;
  mostrarPdfViewer: boolean = false;
  errorArchivo = ""
  mostrarAlerta = false
  tipoAlerta = "success"
  mensajeAlerta = ""

  private modalRef: any
  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario()
    this.cargarContratos()


    setTimeout(() => {
      this.depurarContratos()
    }, 2000)
  }

  ngAfterViewInit() {
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

  guardarContrato(): void {
    if (this.contratoForm.invalid) {
      Object.keys(this.contratoForm.controls).forEach((key) => {
        this.contratoForm.get(key)?.markAsTouched()
      })
      return
    }

    this.enviando = true
    const formData = new FormData()
    const contratoData = this.contratoForm.value
    console.log("Datos del contrato a enviar:", contratoData)

    formData.append("contratoData", JSON.stringify(contratoData))


    if (this.archivoSeleccionado) {
      formData.append("archivoPdf", this.archivoSeleccionado)
    }

    if (this.contratoSeleccionado) {
      // Update existing contract
      this.contratoService.actualizarContrato(this.contratoSeleccionado._id, formData).subscribe({
        next: (contratoActualizado) => {
          // Update the contract in the list
          const index = this.contratos.findIndex((c) => c._id === contratoActualizado._id)
          if (index !== -1) {
            this.contratos[index] = contratoActualizado
            this.ordenarContratosPorEstado()
          }

          this.mostrarMensaje("success", "Contrato actualizado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error) => {
          console.error("Error al actualizar contrato:", error)
          this.mostrarMensaje("danger", "Error al actualizar el contrato")
          this.enviando = false
        },
      })
    } else {
      // Create new contract
      this.contratoService.crearContrato(formData).subscribe({
        next: (nuevoContrato) => {
          this.contratos.push(nuevoContrato)
          this.ordenarContratosPorEstado()
          this.mostrarMensaje("success", "Contrato creado correctamente")
          this.cerrarModal()
          this.enviando = false
        },
        error: (error) => {
          console.error("Error completo:", error)
          this.mostrarMensaje("danger", "Error al crear el contrato")
          this.enviando = false
        },
      })
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


  cerrarVisualizador(): void {
    this.mostrarPdfViewer = false;
    this.pdfSrc = null;
  }
  visualizarPdf(contratoId: string): void {
    this.cargandoPdf = true;
    this.mostrarPdfViewer = true;
    this.contratoSeleccionado = this.contratos.find(c => c._id === contratoId);

    this.contratoService.obtenerUrlPdf(contratoId).subscribe({
      next: (response: any) => {
        this.pdfSrc = response.url;
        this.cargandoPdf = false;
      },
      error: (error) => {
        console.error('Error al obtener el PDF:', error);
        this.cargandoPdf = false;
        this.mostrarPdfViewer = false;
      }
    });
  }
  cargarContratos(): void {
    this.cargando = true
    this.contratoService.getContratos().subscribe({
      next: (data: any[]) => {
        this.contratos = data
        this.contratosFiltrados = [...this.contratos]
        this.contratos.forEach((contrato) => {
          console.log(
            "Contrato:",
            contrato.clienteNombre || contrato.clientName,
            "Estado:",
            this.getEstadoTexto(contrato),
          )
        })

        this.cargando = false
      },
      error: (error: any) => {
        console.error("Error al cargar contratos:", error)
        this.mostrarMensaje("error", "Error al cargar los contratos")
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

  editarContrato(id: string): void {
    this.cargando = true
    this.contratoService.getContrato(id).subscribe({
      next: (contrato: { clienteNombre: any; numeroContrato: any; clienteEmail: any; descripcion: any; fechaInicio: string | number | Date; fechaVencimiento: string | number | Date; archivoPdf: { nombre: string; }; }) => {
        this.contratoSeleccionado = contrato


        this.contratoForm.patchValue({
          clientName: contrato.clienteNombre,
          numeroContrato: contrato.numeroContrato,
          clientEmail: contrato.clienteEmail,
          description: contrato.descripcion,
          startDate: new Date(contrato.fechaInicio).toISOString().substring(0, 10),
          expirationDate: new Date(contrato.fechaVencimiento).toISOString().substring(0, 10),
          archivoPdf: contrato.archivoPdf
        })


        if (contrato.archivoPdf && contrato.archivoPdf.nombre) {
          this.nombreArchivo = contrato.archivoPdf.nombre
        } else {
          this.limpiarArchivo()
        }

        this.cargando = false
      },
      error: (error: any) => {
        console.error("Error al cargar el contrato:", error)
        this.mostrarMensaje("danger", "Error al cargar el contrato")
        this.cargando = false
      },
    })
  }



  eliminarContrato(id: string): void {
    if (confirm("¿Está seguro de eliminar este contrato?")) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          this.contratos = this.contratos.filter((c) => c._id !== id)
          this.contratosFiltrados = [...this.contratos]
          this.mostrarMensaje("success", "Contrato eliminado correctamente")
        },
        error: (error: any) => {
          console.error("Error al eliminar contrato:", error)
          this.mostrarMensaje("danger", "Error al eliminar el contrato")
        },
      })
    }
  }

  verContrato(contrato: any): void {
    this.contratoSeleccionado = contrato
    console.log("Contrato seleccionado:", this.contratoSeleccionado)
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0]
    if (file) {

      if (file.type !== "application/pdf") {
        this.errorArchivo = "Solo se permiten archivos PDF"
        this.archivoSeleccionado = null
        this.nombreArchivo = ""
        return
      }

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
    const fileInput = document.getElementById("archivoPdf") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  tienePdf(contrato: any): boolean {
    return contrato.archivoPdf && contrato.archivoPdf.nombre
  }

  descargarPdf(id: string, clientName: string): void {
    this.contratoService.descargarPdf(id).subscribe({
      next: (blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contrato-${clientName}.pdf`
        document.body.appendChild(a)
        a.click()

        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      },
      error: (error: any) => {
        console.error("Error al descargar PDF:", error)
        this.mostrarMensaje("danger", "Error al descargar el PDF")
      },
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


  getEstadoTexto(contrato: any): string {
    try {
      const hoy = new Date()
      const fechaVencimientoStr = contrato.fechaVencimiento || contrato.expirationDate
      if (!fechaVencimientoStr) {
        console.error("Contrato sin fecha de vencimiento:", contrato)
        return "Desconocido"
      }
      const fechaVencimiento = new Date(fechaVencimientoStr)
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      if (diasRestantes < 0) {
        return "Vencido"
      } else if (diasRestantes <= 30) {
        return "Por vencer"
      } else {
        return "Activo"
      }
    } catch (error) {
      console.error("Error al calcular estado del contrato:", error, contrato)
      return "Desconocido"
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

  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => this.getEstadoTexto(contrato) === estado)
  }

  cerrarModal(): void {
    if (this.modalRef) {
      this.modalRef.hide()
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

  depurarContratos(): void {
    console.log("===== DEPURACIÓN DE CONTRATOS =====")
    console.log("Total de contratos:", this.contratos.length)
    console.log("Activos:", this.filtrarPorEstado("Activo").length)
    console.log("Por vencer:", this.filtrarPorEstado("Por vencer").length)
    console.log("Vencidos:", this.filtrarPorEstado("Vencido").length)

    this.contratos.forEach((contrato, index) => {
      console.log(
        `Contrato #${index + 1}:`,
        contrato.clienteNombre || contrato.clientName,
        "Estado:",
        this.getEstadoTexto(contrato),
      )
    })
  }


  nuevoContrato: any = {
    clientName: '',
    clientEmail: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    numeroContrato: '',
    clienteNombre: '',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  resetearFormulario() {
    this.nuevoContrato = {
      clientName: '',
      clientEmail: '',
      description: '',
      startDate: '',
      expirationDate: '',
      numeroContrato: '',
      clienteNombre: '',
      fechaVencimiento: '',

    };
  }

}

