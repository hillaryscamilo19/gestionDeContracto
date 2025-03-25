import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Modal } from 'bootstrap';
import { Observable } from 'rxjs';
import { ContractModule } from 'src/app/models/contract/contract.module';
import { ClienteService } from 'src/app/services/Cliente/cliente.service';
import { ContractoService } from 'src/app/services/contracto/contracto.service';

@Component({
  selector: 'app-detalle-contrato',
  templateUrl: './detalle-contrato.component.html',
  styleUrls: ['./detalle-contrato.component.css'],
  providers: [DatePipe]
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
contratoId = ""
// Propiedades para el visor de PDF
mostrarPdfViewer = false
cargandoPdf = false
Array = Array
pdfSrc: SafeResourceUrl | null = null
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
  private apiUrl = "https://localhost:7299/api"

  constructor(

    private fb: FormBuilder,
    public contratoService: ContractoService,
    private clientService: ClienteService,
    private datePipe: DatePipe,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {
    this.contratoForm = this.fb.group({
      clientId: ["", Validators.required],
      clienteNombre: ["", Validators.required],
      NumeroContrato: ["", Validators.required],
      Descripcion: ["", Validators.required],
      creado: [new Date().toISOString().substring(0, 10), Validators.required],
      vencimiento: ["", Validators.required],
      tipoContrato: ["local", Validators.required],
      empresaPropietario: ["ssv", Validators.required],
      servicio: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      // Verificar que el ID existe y no es ':id'
      if (params["id"] && params["id"] !== ":id") {
        this.contratoId = params["id"]
        console.log("ID del contrato extraído de la ruta:", this.contratoId)
        this.cargarContratos()
      } else {
        console.error("ID de contrato no válido en la ruta:", params)
        alert("Error: ID de contrato no válido")
      }
    })
    this.cargarContratos()
    this.cargarClientes()
  }

  cargarContratos(): void {
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data
        console.log("Contratos cargados:", this.contratos)
      },
      error: (error) => {
        console.error("Error al cargar contratos:", error)
      },
    })
  }


  cargarClientes(): void {
    this.clientService.getClientes().subscribe(
      (data: any[]) => {
        this.clients = data
      },
      (error: HttpErrorResponse) => {
        console.error("Error al cargar los clientes:", error)
      },
    )
  }



    cerrarVisualizador(): void {
      this.mostrarPdfViewer = false
      this.pdfSrc = null
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

  formatDate(date: string): string {
    if (!date || date === '0001-01-01T00:00:00') return 'No especificada';
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  tienePdf(contrato: any): boolean {
    return this.contratoService.tienePdf(contrato)
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
        contrato.clienteNombre.toLowerCase().includes(termino) ||
        contrato.descripcion.toLowerCase().includes(termino),
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

  getOwnerName(empresaPropietario: string): string {
    const owners: Record<string, string> = {
      ssv: "SSV",
      klarida: "Klarida",
      abrah: "Abrah",
      softexpert: "Softexpert",
    }
    return owners[empresaPropietario] || empresaPropietario
  }

  eliminarContrato(id: string): void {
    if (confirm('¿Está seguro que desea eliminar este contrato? Esta acción no se puede deshacer.')) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          // Mostrar mensaje de éxito
          console.log('Contrato eliminado con éxito');
        },
        error: (error) => {
          console.error('Error al eliminar contrato:', error);
        }
      });
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
          clienteId: contrato.clienteId || "",
          clienteNombre: contrato.clienteNombre || contrato.clienteNombre,
          clientEmail: contrato.clienteEmail || contrato.clientEmail,
          tipoContrato: contrato.tipoContrato || contrato.tipoContrato,
          description: contrato.descripcion || contrato.description,
          creado: new Date(contrato.fechaInicio || contrato.creado).toISOString().substring(0, 10),
          vencimiento: new Date(contrato.vencimiento || contrato.vencimiento).toISOString().substring(0, 10),
          contractType: contrato.contractType || "local",
          empresaPropietario: contrato.owner || "ssv",
          servicio: contrato.serviceType || "",
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
          clienteNombre: selectedClient.name,
          clientEmail: selectedClient.email,
        })
      }
    }
  }

  onFileSelected(event: any): void {
    // Verifica si el evento tiene un archivo asociado
    if (event.target && event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
  
      if (file) {
        // Verificar que sea un PDF
        if (file.type !== "application/pdf") {
          this.errorArchivo = "Solo se permiten archivos PDF";
          this.archivoSeleccionado = null;
          this.nombreArchivo = "";
          return;
        }
  
        // Verificar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorArchivo = "El archivo no debe superar los 5MB";
          this.archivoSeleccionado = null;
          this.nombreArchivo = "";
          return;
        }
  
        this.archivoSeleccionado = file;
        this.nombreArchivo = file.name;
        this.errorArchivo = "";
      }
    } else {
      console.error("No se seleccionó un archivo válido.");
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



  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => this.getEstadoTexto(contrato) === estado)
  }
  
  visualizarPdf(id: string | number): void {
    if (!id) {
      console.error("No se pudo determinar el ID del contrato");
      alert("Error: No se pudo determinar el ID del contrato");
      return;
    }
  
    console.log("Visualizando PDF para contrato ID:", id);
    this.cargandoPdf = true;
    this.mostrarPdfViewer = true;
  
    this.contratoService.obtenerPdfBlob(id).subscribe({
      next: (blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);  // Esto es para Angular
        this.cargandoPdf = false;
      },
      error: (error) => {
        console.error("Error al obtener el PDF:", error);
        this.cargandoPdf = false;
        this.mostrarPdfViewer = false;
        alert("Error al visualizar el PDF. Por favor intente nuevamente.");
      },
    });
  }
  
  

  obtenerPdfBlob(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/Archivos/ver/${id}`, {
      responseType: 'blob',
    });
  }

  descargarPdf(id: string | number, nombreCliente: string): void {
    if (!id) {
      console.error("No se encontró un archivo para descargar.");
      alert("No se encontró un archivo para descargar.");
      return;
    }
  
    console.log("Descargando PDF con ID:", id);
  
    this.obtenerPdfBlob(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Contrato_${nombreCliente || "Descarga"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error("Error al descargar PDF:", error);
        alert("Error al descargar el PDF. Por favor intente nuevamente.");
      },
    });
  }
  
  getArchivoId(contrato: any): number | null {
    if (!contrato) {
      console.error("Contrato no definido.");
      return null;
    }
  
    if (!Array.isArray(contrato.archivos)) {
      console.error("El contrato no tiene un array de archivos:", contrato.archivos);
      return null;
    }
  
    if (contrato.archivos.length === 0) {
      console.error("El contrato no tiene archivos.");
      return null;
    }
  
    console.log("Archivo encontrado:", contrato.archivos[0]);
    return contrato.archivos[0].id; // Extrae el ID del primer archivo
  }
  
  
  
  verContratoAnterior(contrato: any): void {
    if (contrato.previousContractPath) {
      window.open(contrato.previousContractPath, "_blank")
    } else {
      alert("No hay contrato anterior disponible")
    }
  }

  onUpdate(): void {
    // Formatea la fecha antes de enviarla al backend
    if (this.contrato.fechaVencimiento) {
      this.contrato.fechaVencimiento = this.datePipe.transform(this.contrato.vencimiento, "yyyy-MM-dd") || ""
    }

    // Changed from update to actualizarContrato
    this.contratoService.actualizarContrato(this.contrato._id, this.contrato).subscribe(
      (data: any) => {
        this.mostrarModal = true
        this.mensajeAlerta = "Contrato actualizado exitosamente."
        this.esExitoso = true
        this.cargarContratos()
  
      },
      (err: any) => {
        this.mostrarModal = true
        this.mensajeAlerta = "Error al actualizar el contrato."
        this.esExitoso = false
        this.contrato = { ...this.contratoOriginal }
    
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

  }
}
