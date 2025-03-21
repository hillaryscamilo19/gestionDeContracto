import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractoService } from './services/contracto/contracto.service';
import { Client, ContractModule } from './models/contract/contract.module';
import { Modal } from 'bootstrap';
import { ClienteService } from './services/Cliente/cliente.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title: "Gestion de Contrato" | undefined;
  contratos: any[] = []
  contratosFiltrados: any[] = []
  contratoSeleccionado: any = null
  contratoForm!: FormGroup
  cargando = false
  enviando = false
  terminoBusqueda = ""
  clients: any[] = []
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

  nuevoContrato: any = {
    clientName: "",
    clientEmail: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    numeroContrato: "",
    contractType: { type: String, enum: ["local", "internacional", "aseguradora"], default: "local" },
    owner: { type: String, enum: ["ssv", "klarida", "abrah", "softexpert"], default: "local" },
  }
  pdfSeleccionado: File | null = null
  currentYear: any;


  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
    private clientService: ClienteService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario()
    this.cargarClientes()
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
      clientId: ["", Validators.required],
      clientName: ["", Validators.required],
      clientEmail: ["", [Validators.required, Validators.email]],
      contractNumber: ["", Validators.required],
      description: ["", Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expirationDate: ["", Validators.required],
      contractType: ["", Validators.required],
      owner: ["", Validators.required],
      serviceType: ["", Validators.required],
    })
  }

  cargarClientes(): void {
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data
      },
      error: (error) => {
        console.error("Error al cargar clientes:", error)
        this.mostrarMensaje("danger", "Error al cargar los clientes")
      },
    })
  }

  cargarContratos(): void {
    this.cargando = true
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data

        this.contratosFiltrados = [...this.contratos]

        // Depuración: Mostrar los estados de los contratos
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
      error: (error) => {
        console.error("Error al cargar contratos:", error)
        this.mostrarMensaje("error", "Error al cargar los contratos")
        this.cargando = false
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

  abrirFormulario(): void {
    this.contratoSeleccionado = null
    this.contratoForm.reset({
      startDate: new Date().toISOString().substring(0, 10),
      contractType: "local",
      owner: "ssv",
    })
    this.limpiarArchivo()
  }

  editarContrato(id: string): void {
    this.cargando = true
    this.contratoService.getContrato(id).subscribe({
      next: (contrato) => {
        this.contratoSeleccionado = contrato

        // Actualizar el formulario con los datos del contrato
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

        // Si el contrato tiene un archivo PDF, mostrar su nombre
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

  descargarPdf(contratoId: string, nombreCliente: string): void {
    this.contratoService.descargarPdf(contratoId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato-${nombreCliente}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error al descargar el PDF:', error);
      }
    });
  }

  cerrarVisualizador(): void {
    this.mostrarPdfViewer = false;
    this.pdfSrc = null;
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
  }

  // Métodos para manejo de archivos
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Solo se permiten archivos PDF");
        return;
      }
      this.pdfSeleccionado = file;
      console.log("Archivo seleccionado:", this.pdfSeleccionado);
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



  // Métodos para filtrar y clasificar contratos
  filtrarContratos(): void {
    if (!this.terminoBusqueda.trim()) {
      this.contratosFiltrados = [...this.contratos]
      return
    }

    const termino = this.terminoBusqueda.toLowerCase().trim()
    this.contratosFiltrados = this.contratos.filter(
      (contrato) =>
        (contrato.clientName || contrato.clienteNombre || "").toLowerCase().includes(termino) ||
        (contrato.description || contrato.descripcion || "").toLowerCase().includes(termino) ||
        (contrato.clientEmail || contrato.clienteEmail || "").toLowerCase().includes(termino) ||
        (contrato.contractType || "").toLowerCase().includes(termino) ||
        (contrato.owner || "").toLowerCase().includes(termino) ||
        (contrato.serviceType || "").toLowerCase().includes(termino),
    )
  }

  // Reemplazar la función getEstadoTexto con esta versión mejorada
  getEstadoTexto(contrato: any): string {
    try {
      const hoy = new Date()

      // Verificar qué propiedad está usando el objeto contrato
      const fechaVencimientoStr = contrato.fechaVencimiento || contrato.expirationDate

      if (!fechaVencimientoStr) {
        console.error("Contrato sin fecha de vencimiento:", contrato)
        return "Desconocido"
      }

      const fechaVencimiento = new Date(fechaVencimientoStr)

      // Calcular días restantes
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

      console.log(
        "Contrato:",
        contrato.clienteNombre || contrato.clientName,
        "Fecha vencimiento:",
        fechaVencimiento.toISOString().split("T")[0],
        "Días restantes:",
        diasRestantes,
      )

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

  // Método para filtrar contratos por estado
  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => this.getEstadoTexto(contrato) === estado)
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    if (this.modalRef) {
      this.modalRef.hide()
    }
  }

  // Método para mostrar mensajes de alerta
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

  // Obtener el nombre del cliente a partir del ID
  getClientName(clientId: string): string {
    const client = this.clients.find((c) => c._id === clientId)
    return client ? client.name : "Cliente no encontrado"
  }

  // Obtener el nombre del tipo de contrato
  getContractTypeName(type: string): string {
    const types: Record<string, string> = {
      local: "Local",
      internacional: "Internacional",
      aseguradora: "Aseguradora",
    }
    return types[type] || type
  }

  // Obtener el nombre del propietario
  getOwnerName(owner: string): string {
    const owners: Record<string, string> = {
      ssv: "SSV",
      klarida: "Klarida",
      abrah: "Abrah",
      softexpert: "Softexpert",
    }
    return owners[owner] || owner
  }

  verContratoAnterior(contrato: any): void {
    if (contrato.previousContractPath) {
      window.open(contrato.previousContractPath, "_blank")
    } else {
      this.mostrarMensaje("info", "No hay contrato anterior disponible")
    }
  }



  crearContrato() {
    console.log("Datos a enviar:", this.nuevoContrato)
    const formData = new FormData()
    const camposRequeridos = [
      "clientName",
      "clientEmail",
      "description",
      "startDate",
      "expirationDate",
      "numeroContrato",
      "contractType",
      "owner"
    ]
    if (!this.pdfSeleccionado) {
      alert("Debes adjuntar un archivo PDF antes de crear el contrato.");
      return;
    }

    const contratoData = {
      clientName: this.nuevoContrato.clientName.trim(),
      clientEmail: this.nuevoContrato.clientEmail.trim(),
      description: this.nuevoContrato.description,
      startDate: this.nuevoContrato.startDate,
      expirationDate: this.nuevoContrato.expirationDate,
      numeroContrato: this.nuevoContrato.numeroContrato,
      contractType: this.nuevoContrato.contractType,
      owner: this.nuevoContrato.owner,
      serviceType: this.nuevoContrato.serviceType
    };

    // Convertir objeto en JSON y enviarlo como campo separado
    formData.append("contratoData", JSON.stringify(contratoData));
    formData.append("archivoPdf", this.pdfSeleccionado, this.pdfSeleccionado.name);

    console.log("📤 Datos que se envían al backend:", formData);

    this.contratoService.crearContrato(formData).subscribe({
      next: (res: any) => {
        console.log("✅ Contrato creado:", res);
        alert("Contrato creado exitosamente");
        this.cargarContratos();
        this.cerrarModal();
        this.resetearFormulario();
      },
      error: (error: any) => {
        console.error("❌ Error en la petición HTTP:", error);
        alert("Error al crear contrato: " + (error.error?.mensaje || "Problema desconocido"));
      },
    });
  }

  resetearFormulario() {
    this.nuevoContrato = {
      clientName: "",
      clientEmail: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      numeroContrato: "",
    }
    this.pdfSeleccionado = null
  }
}
