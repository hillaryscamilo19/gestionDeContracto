import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth/auth-service.service';

@Component({
  selector: 'app-registre',
  templateUrl: './registre.component.html',
  styleUrls: ['./registre.component.css']
})
export class RegistreComponent {
  registroForm: FormGroup
  loading = false
  submitted = false
  error = ""
  success = ""

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthServiceService,
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(["/contratos"])
    }

    this.registroForm = this.formBuilder.group(
      {
        name: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
      },
      {
        validator: this.mustMatch("password", "confirmPassword"),
      },
    )
  }
  get f() {
    return this.registroForm.controls
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName]
      const matchingControl = formGroup.controls[matchingControlName]

      if (matchingControl.errors && !matchingControl.errors["mustMatch"]) {
        return
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true })
      } else {
        matchingControl.setErrors(null)
      }
    }
  }


  goToLogin() {
    this.router.navigate(['/login']);
  }

  onSubmit() {
    this.submitted = true
    this.error = ""
    this.success = ""
    if (this.registroForm.invalid) {
      return
    }

    this.loading = true
    this.authService.register(this.f["name"].value, this.f["email"].value, this.f["password"].value).subscribe({
      next: () => {
        this.success = "Registro exitoso"
        // Redirigir a la página principal después de un breve retraso
        setTimeout(() => {
          this.router.navigate(["/contratos"])
        }, 1500)
      },
      error: (error) => {
        this.error = error.error?.message || "Error en el registro"
        this.loading = false
      },
    })
  }
}
