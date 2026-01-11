import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from '../../src/app/pages/login/login.component';
import { AuthService } from '../../src/app/services/auth.service';
import { LoginResponse } from '@vmekala/data';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockLoginResponse: LoginResponse = {
    access_token: 'mock-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      organizationId: 'org-1',
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      getToken: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to dashboard if user is already authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      component.ngOnInit();

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should initialize form if user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      component.ngOnInit();

      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('should create form with required validators', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      component.ngOnInit();

      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      expect(emailControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.ngOnInit();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.loginForm.get('password');

      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should mark form as invalid when fields are empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should mark form as valid when all fields are correctly filled', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('getEmailError', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.ngOnInit();
    });

    it('should return required error message', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();

      expect(component.getEmailError()).toBe('Email is required');
    });

    it('should return invalid email error message', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      expect(component.getEmailError()).toBe('Please enter a valid email');
    });

    it('should return empty string when no error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('valid@example.com');
      emailControl?.markAsTouched();

      expect(component.getEmailError()).toBe('');
    });
  });

  describe('getPasswordError', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.ngOnInit();
    });

    it('should return required error message', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();

      expect(component.getPasswordError()).toBe('Password is required');
    });

    it('should return minimum length error message', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      passwordControl?.markAsTouched();

      expect(component.getPasswordError()).toBe('Password must be at least 6 characters');
    });

    it('should return empty string when no error', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('password123');
      passwordControl?.markAsTouched();

      expect(component.getPasswordError()).toBe('');
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.ngOnInit();
    });

    it('should not submit if form is invalid', () => {
      component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(component.submitted).toBe(true);
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSubmit();

      expect(component.loginForm.get('email')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should successfully login with valid credentials', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      mockAuthService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      }, 10);
    });

    it('should handle login error', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const errorResponse = {
        error: { message: 'Invalid credentials' },
      };

      mockAuthService.login.mockReturnValue(throwError(() => errorResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(component.errorMessage).toBe('Invalid credentials');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should display default error message when no message in error', (done) => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      mockAuthService.login.mockReturnValue(throwError(() => ({})));

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage).toBe('Login failed. Please check your credentials.');
        done();
      }, 10);
    });

    it('should clear error message on new submission', () => {
      component.errorMessage = 'Previous error';
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      mockAuthService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });

    it('should set submitted flag to true on submission', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      mockAuthService.login.mockReturnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.submitted).toBe(true);
    });
  });

  describe('Form Controls', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.mockReturnValue(false);
      component.ngOnInit();
    });

    it('should have email getter that returns email control', () => {
      const emailControl = component.email;
      expect(emailControl).toBe(component.loginForm.get('email'));
    });

    it('should have password getter that returns password control', () => {
      const passwordControl = component.password;
      expect(passwordControl).toBe(component.loginForm.get('password'));
    });
  });
});
