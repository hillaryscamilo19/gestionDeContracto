import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contracto',
  templateUrl: './contracto.component.html',
  styleUrls: ['./contracto.component.css']
})
export class ContractoComponent {
  contratoForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.contratoForm = this.fb.group({
      numeroContrato: ['', Validators.required],
      descripcion: ['', Validators.required],
      estado: ['Activo'],
      clienteNombre: ['', Validators.required],
      vencimiento: [''],
      clienteId: [null, Validators.required],
      serviciosId: [null, Validators.required],
      servicio: ['', Validators.required],
      empresa: ['', Validators.required],
      tipoContrato: ['', Validators.required],
      empresaPropietario: ['', Validators.required]
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  onSubmit() {
    if (this.contratoForm.invalid) return;

    this.isSubmitting = true;

    const formData = new FormData();
    const formValues = this.contratoForm.value;

    // Agregar campos del contrato
    for (const key in formValues) {
      if (formValues.hasOwnProperty(key)) {
        formData.append(key, formValues[key]);
      }
    }

    // Agregar archivos
    this.selectedFiles.forEach(file => {
      formData.append('archivos', file);
    });

    // Enviar al backend
    this.http.post('http://10.0.0.15:5210/api/Contrato/create', formData)
      .subscribe({
        next: () => {
          this.router.navigate(['/contratos']);
        },
        error: err => {
          console.error('Error al guardar contrato:', err);
          this.isSubmitting = false;
        }
      });
  }
}
