import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../services/auth.service';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authService: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      login: vi.fn()
    };
    
    router = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginPageComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should have required validators on username and password', () => {
    const username = component.loginForm.get('username');
    const password = component.loginForm.get('password');

    expect(username?.hasError('required')).toBe(true);
    expect(password?.hasError('required')).toBe(true);
  });

  it('should mark form as invalid when fields are empty', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should mark form as valid when fields are filled', () => {
    component.loginForm.patchValue({
      username: 'testuser',
      password: 'testpass'
    });
    expect(component.loginForm.valid).toBe(true);
  });

  it('should call authService.login on form submission with valid credentials', () => {
    authService.login.mockReturnValue(of(true));
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password123'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'password123'
    });
  });

  it('should navigate to /expenses on successful login', () => {
    authService.login.mockReturnValue(of(true));
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password123'
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/expenses']);
  });

  it('should display error message on failed login', () => {
    authService.login.mockReturnValue(of(false));
    
    component.loginForm.patchValue({
      username: 'wrong',
      password: 'wrong'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid username or password');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should clear password field on failed login', () => {
    authService.login.mockReturnValue(of(false));
    
    component.loginForm.patchValue({
      username: 'wrong',
      password: 'wrong'
    });

    component.onSubmit();

    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should not call authService.login when form is invalid', () => {
    component.loginForm.patchValue({
      username: '',
      password: ''
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should clear error message on new submission attempt', () => {
    component.errorMessage = 'Previous error';
    authService.login.mockReturnValue(of(true));
    
    component.loginForm.patchValue({
      username: 'admin',
      password: 'password123'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('');
  });
});
