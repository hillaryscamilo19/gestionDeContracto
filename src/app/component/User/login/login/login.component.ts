import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth/auth-service.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthServiceService
  ) {

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {

    if (this.authService.currentUserValue) {
      this.router.navigate(['/contratos']);
    }
  }
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: () => {
          this.router.navigate(['/contratos']);
        },
        error: (error: { message: string; }) => {
          this.error = error.message || 'Login failed';
          this.loading = false;
        }
      });
  }
  goToRegister() {
    this.router.navigate(['/register']);
  }


}
