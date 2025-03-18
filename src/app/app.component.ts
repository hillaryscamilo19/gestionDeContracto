import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ContractoService } from './services/contracto/contracto.service';
import { ContractModule } from './models/contract/contract.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  pdfSeleccionado: File | null = null;
  @Input() cargando: boolean = false;
  private modalRef: any;
   contratosFiltrados: ContractModule[] = [];
  @Input() contratos: any[] = [];
  title = 'Registro De Contracto';
  currentYear = new Date().getFullYear();

  constructor(private fb: FormBuilder, private contratoService: ContractoService) { }

  ngOnInit(): void {
    this.cargarContratos();
    setTimeout(() => {
      console.log('ALL:',this.filtrarPorEstado('ALL'));
      console.log('Activo:', this.filtrarPorEstado('Activo'));
      console.log('Por vencer:', this.filtrarPorEstado('Por vencer'));
      console.log('Vencidos:', this.filtrarPorEstado('Vencido'));
    }, 1000);
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

  filtrarPorEstado(estado: string): any[] {
    return this.contratos.filter((contrato) => contrato.estado === estado);
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

  cerrarModal(): void {
    if (this.modalRef) this.modalRef.hide();
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

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.pdfSeleccionado = file;
    } else {
      alert('Por favor selecciona un archivo PDF válido.');
      this.pdfSeleccionado = null;
    }
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
