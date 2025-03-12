import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { ContractModule } from '../../../models/contract/contract.module';

@Component({
  selector: 'app-formulario-contrato',
  templateUrl: './formulario-contrato.component.html',
  styleUrls: ['./formulario-contrato.component.css']
})
export class FormularioContratoComponent implements OnInit {
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
    this.inicializarFormulario();

    this.contratoId = this.route.snapshot.paramMap.get('id');
    if (this.contratoId) {
      this.modoEdicion = true;
      this.cargarContrato();
    }
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
