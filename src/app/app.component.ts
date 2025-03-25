import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractoService } from './services/contracto/contracto.service';
import { Client, ContractModule } from './models/contract/contract.module';
import { Modal } from 'bootstrap';
import { ClienteService } from './services/Cliente/cliente.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as bootstrap from 'bootstrap';

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
  filteredClients: any[] = [];
  terminoBusqueda = ""
  clientes: any[] = []
  archivoSeleccionado: File | null = null
  nombreArchivo = ""
  cargandoPdf: boolean = false;
  mostrarPdfViewer: boolean = false;
  errorArchivo = ""
  allClients: any[] = [];
  filtroTipoContrato: number | null = null;
  filtroPropietario: number | null = null;
  searchTerm: string = '';
  filterType: string = 'all';
  mostrarAlerta = false
  tiposContrato: any[] = []
  servicio: any[] = [];
  empresaPropietario: any[] = []
  tipoAlerta = "success"
  mensajeAlerta = ""
  private modalRef: any
  pdfSrc: string | ArrayBuffer | SafeResourceUrl | null = null;
  // En tu componente
nuevoContrato: any = {
  numeroContrato: '',
  clienteId: null,
  tipoContrato: null,
  empresaPropietario: null,
  servicio: null,
  creado: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
  vencimiento: '', 
  descripcion: ''
};
  currentYear: any;


  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
    private clientService: ClienteService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario()
    this.cargarClientes()
    this.cargarContratos()
    this.filtrarContratos()
    this.cargarTiposContrato()
    this.cargarEmpresasPropietario()
    this.cargarTipoServicios()

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
      clienteId: ["", Validators.required],
      clienteNombre: ["", Validators.required],
      numeroContrato: ["", Validators.required],
      descripcion: ["", Validators.required],
      creado: [new Date().toISOString().substring(0, 10), Validators.required],
      vencimiento: ["", Validators.required],
      tipoContrato: ["", Validators.required],
      empresaPropietario: ["", Validators.required],
      servicio: ["", Validators.required],
    })
  }

  cargarClientes(): void {
    this.clientService.getClientes
      ().subscribe({
        next: (data) => {
          this.clientes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar clientes:', error);
        }
      });
  }
  cargarContratos(): void {
    this.cargando = true;
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar contratos:', error);
        this.cargando = false;
      }
    });
  }

  onClientChange(event: any): void {
    const clientId = event.target.value
    if (clientId) {
      const selectedClient = this.clientes.find((c) => c._id === clientId)
      if (selectedClient) {
        this.contratoForm.patchValue({
          clienteNombre: selectedClient.name,
        })
      }
    }
  }

  abrirFormulario(): void {
    this.contratoSeleccionado = null
    this.contratoForm.reset({
      creado: new Date().toISOString().substring(0, 10),
      tipoContrato: "local",
      empresaPropietario: "ssv",
    })
    this.limpiarArchivo()
  }

  // Agrega un método para manejar el cambio en el selector
onTipoContratoChange(event: any): void {
  console.log('Tipo de contrato seleccionado:', event.target.value);
  this.nuevoContrato.tipoContrato = event.target.value;
}

  cargarTiposContrato(): void {
    // Si los tipos de contrato se cargan desde el servidor
    this.contratoService.getTiposContrato().subscribe({
      next: (data) => {
        this.tiposContrato = data;
        console.log('Tipos de contrato cargados:', this.tiposContrato);
      },
      error: (error) => {
        console.error('Error al cargar tipos de contrato:', error);
      }
    });

    // O si son estáticos
    this.tiposContrato = [
      { id: 'local', descripcion: 'Local' },
      { id: 'internacional', descripcion: 'Internacional' },
      { id: 'aseguradora', descripcion: 'Aseguradora' }
    ];
    console.log('Tipos de contrato cargados:', this.tiposContrato);
  }
  cargarTipoServicios(): void {
    this.contratoService.getTipoServicio().subscribe({
      next: (data) => {
        this.servicio = data;
      },
      error: (error) => {
        console.error('Error al cargar tipos de contrato:', error);
      }
    });
  }


  cargarEmpresasPropietario(): void {
    this.contratoService.getEmpresasPropietario().subscribe({
      next: (data) => {
        this.empresaPropietario = data;
      },
      error: (error) => {
        console.error('Error al cargar empresas propietario:', error);
      }
    });
  }


  editarContrato(id: string): void {
    this.cargando = true
    this.contratoService.getContrato(id).subscribe({
      next: (contrato) => {
        this.contratoSeleccionado = contrato

        // Actualizar el formulario con los datos del contrato
        this.contratoForm.patchValue({
          clienteNombre: contrato.clienteNombre || contrato.clienteNombre,
          clientEmail: contrato.clienteEmail || contrato.clientEmail,
          numeroContrato: contrato.numeroContrato || contrato.numeroContrato,
          descripcion: contrato.descripcion || contrato.descripcion,
          creado: new Date(contrato.creado || contrato.creado).toISOString().substring(0, 10),
          vencimiento: new Date(contrato.vencimiento || contrato.vencimiento).toISOString().substring(0, 10),
          tipoContrato: contrato.tipoContrato || "local",
          empresaPropietario: contrato.empresaPropietario || "ssv",
          servicio: contrato.servicio || "",
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

  descargarPdf(contratoId: string): void {
    // Primero obtener el nombre del cliente
    this.contratoService.getContrato(contratoId).subscribe({
      next: (contrato) => {
        // Luego obtener el blob del PDF
        this.contratoService.obtenerPdfBlob(contratoId).subscribe({
          next: (blob) => {
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
    const formData = new FormData()
    const contratoData = this.contratoForm.value
    console.log("Datos del contrato a enviar:", contratoData)

    formData.append("contratoData", JSON.stringify(contratoData))
    if (this.archivoSeleccionado) {
      formData.append("archivoPdf", this.archivoSeleccionado)
    }

    if (this.contratoSeleccionado && this.contratoSeleccionado._id) {
      const id = this.contratoSeleccionado._id.toString()
      console.log("Actualizando contrato con ID:", id)

      this.contratoService.actualizarContrato(id, formData).subscribe({
        next: (contratoActualizado) => {
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (file.type !== 'application/pdf') {
        this.errorArchivo = 'Solo se permiten archivos PDF';
        this.archivoSeleccionado = null;
        this.pdfSrc = null;
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.errorArchivo = 'El archivo no debe superar los 5MB';
        this.archivoSeleccionado = null;
        this.pdfSrc = null;
        return;
      }

      this.archivoSeleccionado = file;
      this.errorArchivo = '';

      // Crear vista previa del PDF
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
      };
      reader.readAsDataURL(file);
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
        (contrato.clienteNombre || contrato.clienteNombre || "").toLowerCase().includes(termino) ||
        (contrato.descripcion || contrato.descripcion || "").toLowerCase().includes(termino) ||
        (contrato.tipoContrato || "").toLowerCase().includes(termino) ||
        (contrato.empresaPropietario || "").toLowerCase().includes(termino) ||
        (contrato.servicio || "").toLowerCase().includes(termino),
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



  applyFilters(): void {
    // Filtrar por término de búsqueda
    let result = this.allClients;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(client =>
        (client.name || '').toLowerCase().includes(term) ||
        (client.email || '').toLowerCase().includes(term) ||
        (client.phone || '').toLowerCase().includes(term)
      );
    }

    // Filtrar por tipo
    if (this.filterType !== 'all') {
      if (this.filterType === 'active') {
        result = result.filter(client => client.hasActiveContracts);
      } else if (this.filterType === 'inactive') {
        result = result.filter(client => !client.hasActiveContracts);
      } else if (this.filterType === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        result = result.filter(client => {
          if (!client.createdAt) return false;
          const createdAt = new Date(client.createdAt);
          return createdAt >= thirtyDaysAgo;
        });
      }
    }

    this.filteredClients = result;
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

    this.contratos.forEach((contrato, index) => {
    })
  }


  getClientName(clientId: string): string {
    const client = this.clientes.find((c) => c._id === clientId)
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


  crearContrato(): void {
    // Validar que todos los campos requeridos estén completos
    if (!this.nuevoContrato.numeroContrato ||
        !this.nuevoContrato.clienteId ||
        !this.nuevoContrato.tipoContrato ||
        !this.nuevoContrato.empresaPropietario ||
        !this.nuevoContrato.servicio ||
        !this.nuevoContrato.creado ||
        !this.nuevoContrato.vencimiento ||
         this.nuevoContrato.descripcion) {

      // Mostrar mensaje de error
      this.mostrarMensaje('danger', 'Por favor complete todos los campos obligatorios');

      // Marcar visualmente los campos faltantes
      const camposFaltantes = [];
      if (!this.nuevoContrato.numeroContrato) camposFaltantes.push('Número de Contrato');
      if (!this.nuevoContrato.clienteId) camposFaltantes.push('Cliente');
      if (!this.nuevoContrato.tipoContrato) camposFaltantes.push('Tipo de Contrato');
      if (!this.nuevoContrato.empresaPropietario) camposFaltantes.push('Propietario');
      if (!this.nuevoContrato.servicio) camposFaltantes.push('Servicio');
      if (!this.nuevoContrato.creado) camposFaltantes.push('Fecha de Creación');
      if (!this.nuevoContrato.vencimiento) camposFaltantes.push('Fecha de Vencimiento');
      if (!this.nuevoContrato.descripcion) camposFaltantes.push('Descripción');

      console.log('Campos faltantes:', camposFaltantes);
      return;
    }

    // Validar que se haya seleccionado un archivo PDF si es requerido
    if (!this.archivoSeleccionado) {
      this.mostrarMensaje('danger', 'Debe adjuntar un archivo PDF');
      return;
    }

    // Continuar con el envío del formulario
    this.enviarFormulario();
  }

  enviarFormulario(): void {
    this.enviando = true;

    // Crear FormData para enviar el archivo junto con los datos
    const formData = new FormData();

    // Agregar todos los campos del contrato
    Object.keys(this.nuevoContrato).forEach(key => {
      formData.append(key, this.nuevoContrato[key]);
    });

    // Agregar el archivo PDF
    if (this.archivoSeleccionado) {
      formData.append('archivoPdf', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    // Imprimir el contenido del FormData para depuración


    // Enviar al servidor
    this.contratoService.crearContrato(formData).subscribe({
      next: (response) => {
        console.log('Contrato creado exitosamente:', response);
        this.mostrarMensaje('success', 'Contrato creado exitosamente');
        this.resetearFormulario();
        this.cerrarModal();
        this.cargarContratos(); // Recargar la lista de contratos
      },
      error: (error) => {
        console.error('Error al crear contrato:', error);

        // Mostrar mensaje de error específico si está disponible
        if (error.error && error.error.message) {
          this.mostrarMensaje('danger', `Error: ${error.error.message}`);
        } else {
          this.mostrarMensaje('danger', 'Error al crear el contrato. Por favor intente nuevamente.');
        }
      },
      complete: () => {
        this.enviando = false;
      }
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  abrirModalNuevoContrato(): void {
    this.resetearFormulario();
    const modalElement = document.getElementById('nuevoContratoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  resetearFormulario(): void {
    this.nuevoContrato = {
      numeroContrato: '',
      clienteId: null,
      tipoContrato: null,
      empresaPropietario: null,
      servicio: '',
      creado: this.formatDateForInput(new Date()),
      vencimiento: '',
      descripcion: '',
      estado: 'Activo'
    };
    this.archivoSeleccionado = null;
    this.pdfSrc = null;
    this.errorArchivo = '';
  }

}
