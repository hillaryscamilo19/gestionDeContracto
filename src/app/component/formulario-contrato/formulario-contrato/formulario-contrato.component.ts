import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { ContractModule } from 'src/app/models/contract/contract.module';


declare var bootstrap: any;

@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css'],
})
export class FormularioContratoComponent implements OnInit {
  @Input() contratos: any[] = [];
  @Input() cargando: boolean = false;
  @Input() contrato: ContractModule[] = [];
  contratosFiltrados: ContractModule[] = [];
  contratoSeleccionado: ContractModule | null = null; 


  faCoffee = faFileCirclePlus;
  pdfSeleccionado: File | null = null;
  contratoForm!: FormGroup;
  enviando = false;
  terminoBusqueda = '';
  archivoSeleccionado: File | null = null;
  nombreArchivo = '';
  errorArchivo = '';

  private modalRef: any;
  modalInstance: any;

  constructor(private fb: FormBuilder, private contratoService: ContractoService) { }

  ngOnInit(): void {
    this.cargarContratos();
    setTimeout(() => {
      console.log('ALL:', this.filtrarPorEstado('ALL'));
      console.log('Activo:', this.filtrarPorEstado('Activo'));
      console.log('Por vencer:', this.filtrarPorEstado('Por vencer'));
      console.log('Vencidos:', this.filtrarPorEstado('Vencido'));
    }, 1000);
  }


  verContrato(contrato: any): void {

  }

  ngAfterViewInit() {
    setTimeout(() => {
      const modalElement = document.getElementById('contratoModal');
      if (modalElement) {
        try {
          import('bootstrap').then((bootstrap) => {
            this.modalInstance = new bootstrap.Modal(modalElement, {
              backdrop: true,
              keyboard: true,
              focus: true
            });
          });
        } catch (error) {
          console.error('Error al inicializar modal:', error);
        }
      }
    }, 100);
  }

  inicializarFormulario(): void {
    this.contratoForm = this.fb.group({
      clientName: ['', Validators.required],
      clienteEmail: ['', [Validators.required, Validators.email]],
      description: ['', Validators.required],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      fechaVencimiento: [new Date().toISOString().substring(0, 10), Validators.required],
      numeroContrato: ['', Validators.toString]
    });
  }

  cargarContratos(): void {
    this.cargando = true;
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data.map((contrato: any) => ({
          ...contrato,
          estado: this.getEstadoTexto(contrato),
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
    const fechaVencimiento = new Date(contrato.expirationDate || contrato.fechaVencimiento);
    const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
    // Lógica corregida
    if (diasRestantes <= 0) return 'Vencido';
    if (diasRestantes <= 30) return 'Por vencer';
    return 'Activo';
  }

  getEstadoClase(contrato: any): string {
    switch (contrato.estado) {
      case 'all':
        return 'table-info';
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
  getFilaClase(contrato: any): string {
    switch (contrato.estado) {
      case 'all': //azul
        return 'table-info';
      case 'Vencido':
        return 'table-danger'; // Rojo
      case 'Por vencer':
        return 'table-warning'; // Amarillo
      case 'Activo':
        return 'table-success'; // Verde
      default:
        return '';
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
    if (!this.contratoForm) {
      this.inicializarFormulario();
    }

    this.contratoSeleccionado = contrato;
    try {
      this.contratoForm.patchValue({
        clientName: contrato.clientName || '',
        clientEmail: contrato.clientEmail || '',
        description: contrato.description || '',
        startDate: contrato.startDate ? new Date(contrato.startDate).toISOString().substring(0, 10) : '',
        expirationDate: contrato.expirationDate ? new Date(contrato.expirationDate).toISOString().substring(0, 10) : '',
        numeroContrato: contrato.numeroContrato || ''
      });

      if (this.modalInstance) {
        this.modalInstance.show();
      }
    } catch (error) {
      console.error('Error al editar contrato:', error);
    }
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
        this.cargarContratos();
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

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.pdfSeleccionado = file;
    } else {
      alert('Por favor selecciona un archivo PDF válido.');
      this.pdfSeleccionado = null;
    }
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

  abrirModal() {
    if (this.modalInstance) {
      this.modalInstance.show();
    } else {
      console.error('Modal no inicializado');
    }
  }

  cerrarModal(): void {
    if (this.modalRef) this.modalRef.hide();
  }

  crearContrato() {
    console.log('Datos a enviar:', this.nuevoContrato); 
    const formData = new FormData();
    const camposRequeridos = [
      'clientName', 'clientEmail', 'description', 'startDate',
      'expirationDate', 'numeroContrato', 'clienteNombre', 'fechaVencimiento', 'clienteEmail'
    ];

    const camposFaltantes = camposRequeridos.filter(campo =>
      !this.nuevoContrato[campo] || this.nuevoContrato[campo] === ''
    );

    if (camposFaltantes.length > 0) {
      alert(`Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`);
      return;
    }

    if (!this.nuevoContrato.clientName?.trim()) {
      alert('El campo Nombre del Cliente es obligatorio');
      return;
    }

    if (!this.nuevoContrato.clienteEmail?.trim()) {
      alert('El campo Email del Cliente es obligatorio');
      return;
    }

    if (this.pdfSeleccionado) {
      formData.append('pdfFile', this.pdfSeleccionado);
    }

    const contratoData = {
      clientName: this.nuevoContrato.clientName.trim(),
      clienteEmail: this.nuevoContrato.clienteEmail.trim(),
      description: this.nuevoContrato.description,
      startDate: this.nuevoContrato.startDate,
      expirationDate: this.nuevoContrato.expirationDate,
      numeroContrato: this.nuevoContrato.numeroContrato,
      clienteNombre: this.nuevoContrato.clienteNombre,
      fechaVencimiento: this.nuevoContrato.fechaVencimiento
    };

    this.contratoService.crearContratoJSON(this.nuevoContrato).subscribe({
      next: (res) => {
        console.log('Contrato creado:', res);
        alert('Contrato creado exitosamente');
        this.cargarContratos();
        this.cerrarModal();
        this.resetearFormulario();
      },
      error: (error) => {
        console.error('Error completo:', error);
        let mensajeError = 'Error al crear contrato';

        if (error.error) {
          if (error.error.mensaje) mensajeError += ': ' + error.error.mensaje;
          if (error.error.error) mensajeError += '\n' + error.error.error;
        }

        alert(mensajeError);
      }

    });
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

