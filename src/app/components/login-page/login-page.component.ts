import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['user'], // Not used, but kept for compatibility
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (success) => {
          if (success) {
            // Load settings after successful login
            this.settingsService.loadSettings().subscribe({
              next: () => {
                this.router.navigate(['/dashboard']);
              },
              error: (error) => {
                console.error('Error loading settings after login:', error);
                // Still navigate to dashboard, settings will use defaults
                this.router.navigate(['/dashboard']);
              }
            });
          } else {
            this.errorMessage = "Clau d'encriptació invàlida (mínim 8 caràcters)";
            this.loginForm.patchValue({ password: '' });
          }
        },
        error: () => {
          this.errorMessage = "S'ha produït un error durant l'inici de sessió";
        }
      });
    }
  }
}
