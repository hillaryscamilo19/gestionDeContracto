import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';

import { ClienteService } from 'src/app/services/Cliente/cliente.service';
import { ContractoService } from 'src/app/services/contracto/contracto.service';
import { ViewChild } from '@angular/core';
import { PdfViewerModalComponent } from './pdf-viewer-modal/pdf-viewer-modal/pdf-viewer-modal.component';
import * as bootstrap from 'bootstrap';
import modal from 'bootstrap/js/dist/modal';

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.css']
})
export class ContractFormComponent {
  @Input() contratos: any[] = [];
  @ViewChild(PdfViewerModalComponent) pdfViewer!: PdfViewerModalComponent;
  contratosFiltrados: any[] = []
  contratoSeleccionado: any = null
  contratoForm!: FormGroup
  cargandoPdf: boolean = false;
  contratosFiltered: any[] = [];
  mostrarPdfViewer: boolean = false;
  cargando = false
  pdfSrc: string | null = null;
  clientes: any[] = [];
  enviando = false
  filtroCliente: string = '';
  filtroEstado: string = '';
  terminoBusqueda: string = '';
  clients: any[] = []
  archivoSeleccionado: File | null = null
  nombreArchivo = ""
  errorArchivo = ""
  loading: any;
  mostrarAlerta = false
  tipoAlerta = "success"
  mensajeAlerta = ""
  private modalRef: any
  error: any;
  modoEdicion: any;
  previousContractUrl: any;
  modalInstance!: Modal;

  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
    private clientService: ClienteService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario()
    this.cargarClientes()
    this.cargarContratos()

    // Añadir un pequeño retraso para asegurar que los contratos se han cargado
    setTimeout(() => {
      this.depurarContratos()
    }, 2000)
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
      clientId: ["", Validators.required],
      clienteNombre: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      numeroContrato: ["", Validators.required],
      description: ["", Validators.required],
      creado: [new Date().toISOString().substring(0, 10), Validators.required],
      vencimiento: ["", Validators.required],
      tipoContrato: ["local", Validators.required],
      empresaPropietario: ["ssv", Validators.required],
      servicio: ["", Validators.required],
    })
  }

  cargarClientes(): void {
    this.clientService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }
  
  aplicarFiltros(): void {
    let resultado = [...this.contratos];
    
    // Filtrar por cliente
    if (this.filtroCliente) {
      resultado = resultado.filter(contrato => contrato.clienteId === this.filtroCliente);
    }
    
    // Filtrar por estado
    if (this.filtroEstado) {
      resultado = resultado.filter(contrato => this.getEstadoTexto(contrato) === this.filtroEstado);
    }
    
    // Filtrar por término de búsqueda
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(contrato => 
        (contrato.clienteNombre || '').toLowerCase().includes(termino) ||
        (contrato.descripcion || '').toLowerCase().includes(termino)
      );
    }
    
    this.contratosFiltered = resultado;
  }

  cargarContratos(): void {
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data;
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error al cargar contratos:', error);
      }
    });
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

  visualizarPdf(contratoId: string): void {
    this.cargandoPdf = true;
    this.mostrarPdfViewer = true;
    this.contratoSeleccionado = this.contratos.find(c => c._id === contratoId);

    this.contratoService.obtenerPdfBlob(contratoId).subscribe({
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


  abrirFormulario(): void {
    this.contratoSeleccionado = null
    this.contratoForm.reset({
      startDate: new Date().toISOString().substring(0, 10),
      tipoContrato: "local",
      owner: "ssv",
    })
    this.limpiarArchivo()
  }

  editarContrato(id: string): void {
    this.cargando = true
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
          tipoContrato: contrato.contractType || "local",
          owner: contrato.owner || "ssv",
          serviceType: contrato.serviceType || "",
        })

        if (contrato.archivoPdf && contrato.archivoPdf.nombre) {
          this.nombreArchivo = contrato.archivoPdf.nombre
        } else {
          this.limpiarArchivo()
        }

        this.cargando = false
      },
      error: (error) => {
        console.error("Error al cargar el contrato:", error)
        this.mostrarMensaje("danger", "Error al cargar el contrato")
        this.cargando = false
      },
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

    // Create FormData for sending data and file
    const formData = new FormData()

    // Add contract data as JSON
    const contratoData = this.contratoForm.value
    console.log("Datos del contrato a enviar:", contratoData)

    formData.append("contratoData", JSON.stringify(contratoData))

    // Add PDF file if it exists
    if (this.archivoSeleccionado) {
      formData.append("archivoPdf", this.archivoSeleccionado)
    }

    if (this.contratoSeleccionado && this.contratoSeleccionado._id) {
      // Update existing contract - make sure we're using a string ID
      const id = this.contratoSeleccionado._id.toString()
      console.log("Actualizando contrato con ID:", id)

      this.contratoService.actualizarContrato(id, formData).subscribe({
        next: (contratoActualizado) => {
          // Update the contract in the list
          const index = this.contratos.findIndex((c) => c._id === contratoActualizado._id)
          if (index !== -1) {
            this.contratos[index] = contratoActualizado

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
      // Create new contract - use the base URL without ID
      console.log("Creando nuevo contrato")

      this.contratoService.crearContrato(formData).subscribe({
        next: (nuevoContrato) => {
          this.contratos.push(nuevoContrato)

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

  eliminarContrato(id: string): void {
    if (confirm("¿Está seguro de eliminar este contrato?")) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          this.contratos = this.contratos.filter((c) => c._id !== id)
          this.contratosFiltrados = [...this.contratos]
          this.mostrarMensaje("success", "Contrato eliminado correctamente")
        },
        error: (error) => {
          console.error("Error al eliminar contrato:", error)
          this.mostrarMensaje("danger", "Error al eliminar el contrato")
        },
      })
    }
  }

  // Función para ver los detalles de un contrato en el modal
  verContrato(contrato: any): void {
    this.contratoSeleccionado = contrato
    console.log("Contrato seleccionado:", this.contratoSeleccionado)
    // No es necesario abrir el modal aquí, ya que se abre con data-bs-target="#staticBackdrop"
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

descargarPdf(id: string): void {
  // Primero obtener el contrato para tener el nombre del cliente
  this.contratoService.getContrato(id).subscribe({
    next: (contrato) => {
      // Luego obtener el blob del PDF
      this.contratoService.obtenerPdfBlob(id).subscribe({
        next: (blob: Blob) => {
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          // Crear enlace de descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `Contrato_${contrato.clienteNombre || 'Descarga'}.pdf`;
          // Simular clic
          link.click();
          // Liberar URL
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error al descargar PDF:', error);
        }
      });
    },
    error: (error: any) => {
      console.error('Error al obtener contrato:', error);
    }
  });
}

  filtrarContratos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.contratosFiltrados = [...this.contratos]
      return
    }

    const termino = this.terminoBusqueda.toLowerCase().trim()
    this.contratosFiltrados = this.contratos.filter(
      (contrato) =>
        (contrato.clientName || contrato.clienteNombre || "").toLowerCase().includes(termino) ||
        (contrato.descripcion || contrato.descripcion || "").toLowerCase().includes(termino) ||
        (contrato.clientEmail || contrato.clienteEmail || "").toLowerCase().includes(termino) ||
        (contrato.tipoContrato || "").toLowerCase().includes(termino) ||
        (contrato.owner || "").toLowerCase().includes(termino) ||
        (contrato.serviceType || "").toLowerCase().includes(termino),
    )
  }

  limpiarFiltros(): void {
    this.filtroCliente = '';
    this.filtroEstado = '';
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  getEstadoTexto(contrato: any): string {
    try {
      const hoy = new Date()
      const fechaVencimientoStr = contrato.fechaVencimiento || contrato.vencimiento
      if (!fechaVencimientoStr) {
        console.error("Contrato sin fecha de vencimiento:", contrato)
        return "Desconocido"
      }
      const fechaVencimiento = new Date(fechaVencimientoStr)
      // Calcular días restantes
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      if (diasRestantes < 0) {
        return "Vencido"
      } else if (diasRestantes <= 30) {
        return "ProximoAvencer"
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
      case "ProximoAvencer":
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

    // Ocultar la alerta después de 5 segundos
    setTimeout(() => {
      this.mostrarAlerta = false
    }, 5000)
  }

  // Añadir un método para depurar todos los contratos
  depurarContratos(): void {
    this.contratos.forEach((contrato, index) => {
    })
  }

  getClientName(clientId: string): string {
    const client = this.clients.find((c) => c._id === clientId)
    return client ? client.name : "Cliente no encontrado"
  }

  getContractTypeName(type: string): string {
    const types: Record<string, string> = {
      local: "Local",
      internacional: "Internacional",
      aseguradora: "Aseguradora",
    }
    return types[type] || type
  }

  getOwnerName(empresaPropietario: string): string {
    const owners: Record<string, string> = {
      ssv: "SSV",
      klarida: "Klarida",
      abrah: "Abrah",
      softexpert: "Softexpert",
    }
    return owners[empresaPropietario] || empresaPropietario
  }

  verContratoAnterior(contrato: any): void {
    if (contrato.previousContractPath) {
      window.open(contrato.previousContractPath, "_blank")
    } else {
      this.mostrarMensaje("info", "No hay contrato anterior disponible")
    }
  }

}
