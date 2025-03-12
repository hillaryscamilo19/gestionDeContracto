import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { ContractModule } from '../../../models/contract/contract.module';
import { faCoffee, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css']
})
export class FormularioContratoComponent implements OnInit {
  faCoffee = faFileCirclePlus;
  contracts = []; // todos los contratos
  activeContracts = []; // activos
  expiringContracts = []; // por vencer
  expiredContracts = []; // vencidos
  mostrarFormulario = false;
  contratoSeleccionado: any = null;
  tabSeleccionado = 0;
  contratoForm!: FormGroup;
  modoEdicion = false;
  contratoId: string | any;
  cargando = false;
  enviando = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private contratoService: ContractoService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.contratoForm = this.fb.group({
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      expirationDate: ['', Validators.required],
    });
    this.inicializarFormulario();
    this.contratoId = this.route.snapshot.paramMap.get('id');
    if (this.contratoId) {
      this.modoEdicion = true;
      this.cargarContrato();
    }
  }

  abrirFormulario(contrato: any = null) {
    this.mostrarFormulario = true;
    this.contratoSeleccionado = null; // nuevo contrato
    if (contrato) {
      // Si es edición, rellenar el formulario
      this.contratoForm.patchValue({
        clientName: contrato.clientName,
        clientEmail: contrato.clientEmail,
        description: contrato.description,
        startDate: contrato.startDate,
        expirationDate: contrato.expirationDate,
      });
    } else {
      // Si es nuevo, limpiar el formulario
      this.contratoForm.reset();
    }
  }

  editarContrato(contrato: any) {
    this.mostrarFormulario = true;
    this.contratoSeleccionado = contrato;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.contratoSeleccionado = null;
  }

  guardarContrato() {
    if (this.contratoForm.valid) {
      const nuevoContrato = this.contratoForm.value;
      if (this.contratoSeleccionado) {
        // Lógica para actualizar contrato
        console.log('Contrato actualizado:', nuevoContrato);
      } else {
        // Lógica para crear contrato
        console.log('Nuevo contrato:', nuevoContrato);
      }
      // Cerrar modal manualmente (opcional si quieres forzarlo)
      const modalElement = document.getElementById('contratoModal');
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        modal?.hide();

      }
      // Reiniciar estado
      this.contratoSeleccionado = null;
    } else {
      console.log('Formulario inválido');
    }
  }

  eliminarContrato(contrato: any) {
    // lógica para eliminar contrato
  }

  inicializarFormulario(): void {
    this.contratoForm = this.fb.group({
      clienteNombre: ['', Validators.required],
      clienteEmail: ['', [Validators.required, Validators.email]],
      numeroContrato: ['', Validators.required],
      descripcion: [''],
      fechaInicio: [new Date().toISOString().substring(0, 10)],
      fechaVencimiento: ['', Validators.required]
    });
  }

  cargarContrato(): void {
    this.cargando = true;
    this.contratoService.getContrato(this.contratoId).subscribe(
      (contrato) => {
        this.contratoForm.patchValue({
          clienteNombre: contrato.clienteNombre,
          clienteEmail: contrato.clienteEmail,
          numeroContrato: contrato.numeroContrato,
          descripcion: contrato.descripcion,
          fechaInicio: new Date(contrato.fechaInicio).toISOString().substring(0, 10),
          fechaVencimiento: new Date(contrato.fechaVencimiento).toISOString().substring(0, 10)
        });
        this.cargando = false;
      },
      (error: any) => {
        this.error = 'Error al cargar el contrato';
        this.cargando = false;
        console.error(error);
      }
    );
  }

  onSubmit(): void {
    if (this.contratoForm.invalid) {
      return;
    }

    this.enviando = true;
    const contrato: ContractModule = this.contratoForm.value;

    if (this.modoEdicion) {
      this.contratoService.actualizarContrato(this.contratoId, contrato).subscribe(
        () => {
          this.enviando = false;
          this.router.navigate(['/contratos']);
        },
        (error) => {
          this.error = 'Error al actualizar el contrato';
          this.enviando = false;
          console.error(error);
        }
      );
    } else {
      this.contratoService.crearContrato(contrato).subscribe(
        () => {
          this.enviando = false;
          this.router.navigate(['/contratos']);
        },
        (error) => {
          this.error = 'Error al crear el contrato';
          this.enviando = false;
          console.error(error);
        }
      );
    }
  }
}
