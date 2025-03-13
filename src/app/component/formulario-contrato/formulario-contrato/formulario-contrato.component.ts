import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';


declare var bootstrap: any;

@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css'],
})
export class FormularioContratoComponent implements OnInit {
  @Input() contratos: any[] = [];
  @Input() cargando: boolean = false;


  faCoffee = faFileCirclePlus;
  contratosFiltrados: any[] = [];
  contratoSeleccionado: any = null;
  contratoForm!: FormGroup;
  enviando = false;
  terminoBusqueda = '';

  // Variables archivos
  archivoSeleccionado: File | null = null;
  nombreArchivo = '';
  errorArchivo = '';

  private modalRef: any;

  constructor(private fb: FormBuilder, private contratoService: ContractoService) {}

  ngOnInit(): void {
    
    this.cargarContratos(); // Carga y asigna estado

    // Probando filtros desde inicio
    setTimeout(() => {
      console.log('Activos:', this.filtrarPorEstado('Activo'));
      console.log('Por vencer:', this.filtrarPorEstado('Por vencer'));
      console.log('Vencidos:', this.filtrarPorEstado('Vencido'));
    }, 1000);
  }


  verContrato(contrato: any): void {

  }

  ngAfterViewInit() {
    const modalElement = document.getElementById('contratoModal');
    if (modalElement) {
      this.modalRef = new bootstrap.Modal(modalElement);
    }
  }

  inicializarFormulario(): void {
    this.contratoForm = this.fb.group({
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      description: ['', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      expirationDate: ['', Validators.required],
    });
  }

  cargarContratos(): void {
    this.cargando = true;
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data.map((contrato: any) => ({
          ...contrato,
          estado: this.getEstadoTexto(contrato), // Agregamos estado al cargar
        }));
        this.contratosFiltrados = [...this.contratos];
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar contratos:', error);
        this.cargando = false;
      },
    });
  }

  getEstadoTexto(contrato: any): string {
    const hoy = new Date();
    const fechaVencimiento = new Date(contrato.expirationDate);
    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) return 'Vencido';
    if (diasRestantes <= 30) return 'Por vencer';
    return 'Activo';
  }

  getEstadoClase(contrato: any): string {
    switch (contrato.estado) {
      case 'Vencido':
        return 'bg-danger';
      case 'Por vencer':
        return 'bg-warning text-dark';
      case 'Activo':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  filtrarContratos(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    if (!termino) {
      this.contratosFiltrados = [...this.contratos];
      return;
    }

    this.contratosFiltrados = this.contratos.filter(
      (contrato) =>
        contrato.clientName.toLowerCase().includes(termino) ||
        contrato.description.toLowerCase().includes(termino) ||
        contrato.clientEmail.toLowerCase().includes(termino)
    );
  }

  filtrarPorEstado(estado: string): any[] {
    console.log(this.contratos.filter((contrato) => contrato.estado === estado));
    
    return this.contratos.filter((contrato) => contrato.estado === estado);
  }

  abrirFormulario(): void {
    this.contratoSeleccionado = null;
    this.contratoForm.reset({
      startDate: new Date().toISOString().substring(0, 10),
    });
    this.limpiarArchivo();
  }

  editarContrato(contrato: any): void {
    this.contratoSeleccionado = contrato;
    this.contratoForm.patchValue({
      clientName: contrato.clientName,
      clientEmail: contrato.clientEmail,
      description: contrato.description,
      startDate: new Date(contrato.startDate).toISOString().substring(0, 10),
      expirationDate: new Date(contrato.expirationDate).toISOString().substring(0, 10),
    });
    this.nombreArchivo = contrato.archivoPdf?.nombre || '';
  }

  guardarContrato(): void {
    if (this.contratoForm.invalid) {
      Object.keys(this.contratoForm.controls).forEach((key) => this.contratoForm.get(key)?.markAsTouched());
      return;
    }

    this.enviando = true;
    const formData = new FormData();
    formData.append('contratoData', JSON.stringify(this.contratoForm.value));
    if (this.archivoSeleccionado) formData.append('archivoPdf', this.archivoSeleccionado);

    const request$ = this.contratoSeleccionado
      ? this.contratoService.actualizarContrato(this.contratoSeleccionado._id, formData)
      : this.contratoService.crearContrato(formData);

    request$.subscribe({
      next: (contrato) => {
        this.cargarContratos(); // Recargar y actualizar con estado
        this.cerrarModal();
        this.enviando = false;
      },
      error: (error) => {
        console.error('Error al guardar contrato:', error);
        this.enviando = false;
      },
    });
  }

  eliminarContrato(id: string): void {
    if (confirm('¿Está seguro de eliminar este contrato?')) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => this.cargarContratos(),
        error: (error) => console.error('Error al eliminar contrato:', error),
      });
    }
  }

  // Archivos
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.errorArchivo = 'Solo se permiten archivos PDF';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorArchivo = 'El archivo no debe superar los 5MB';
      return;
    }

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
    this.errorArchivo = '';
  }

  limpiarArchivo(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.errorArchivo = '';
    const fileInput = document.getElementById('archivoPdf') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  tienePdf(contrato: any): boolean {
    return contrato.archivoPdf && contrato.archivoPdf.nombre;
  }

  descargarPdf(id: string, nombreCliente: string): void {
    this.contratoService.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contrato-${nombreCliente}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => console.error('Error al descargar PDF:', error),
    });
  }

  cerrarModal(): void {
    if (this.modalRef) this.modalRef.hide();
  }

  crearContrato() {
    const formData = new FormData();
    formData.append('clientName', this.nuevoContrato.clientName);
    formData.append('clientEmail', this.nuevoContrato.clientEmail);
    formData.append('description', this.nuevoContrato.description);
    formData.append('startDate', this.nuevoContrato.startDate);
    formData.append('expirationDate', this.nuevoContrato.expirationDate);
    formData.append('numeroContrato', this.nuevoContrato.numeroContrato);
    formData.append('clienteEmail', this.nuevoContrato.clienteEmail);
    formData.append('clienteNombre', this.nuevoContrato.clienteNombre);
    formData.append('fechaVencimiento', this.nuevoContrato.fechaVencimiento);


    this.contratoService.crearContrato(formData).subscribe({
      next: (res) => {
        console.log('Contrato creado:', res);
        this.cargarContratos(); // Recarga la lista de contratos
        const modalElement = document.getElementById('nuevoContratoModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        this.resetearFormulario(); // Limpiar el formulario
      },
      error: (error) => console.error('Error al crear contrato:', error)
    });
  }

  nuevoContrato: any = {
    clientName: '',
    clientEmail: '',
    description: '',
    startDate: '',
    expirationDate: '',
    numeroContrato: '',   
    clienteEmail: '',     
    clienteNombre: '',  
    fechaVencimiento: ''
  };

  
 resetearFormulario() {
    this.nuevoContrato = {
      clientName: '',
      clientEmail: '',
      description: '',
      startDate: '',
      expirationDate: '',
      numeroContrato: '',
      clienteEmail: '',
      clienteNombre: '',
      fechaVencimiento: ''
    };
  }

}

