import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../src/app/services/auth.service';
import { LoginResponse, UserDto } from '@vmekala/data';
import { environment } from '../../src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockRouter: jest.Mocked<Router>;

  const mockLoginResponse: LoginResponse = {
    access_token: 'mock-jwt-token',
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

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should successfully login and store token and user', (done) => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe({
        next: (response) => {
          expect(response).toEqual(mockLoginResponse);
          expect(localStorage.getItem('access_token')).toBe('mock-jwt-token');
          expect(localStorage.getItem('user')).toBe(JSON.stringify(mockLoginResponse.user));
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockLoginResponse);
    });

    it('should set loading state during login', (done) => {
      let loadingStates: boolean[] = [];

      service.loading$.subscribe((loading) => {
        loadingStates.push(loading);
      });

      service.login('test@example.com', 'password123').subscribe({
        next: () => {
          expect(loadingStates).toContain(true);
          expect(loadingStates).toContain(false);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      service.login(email, password).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('access_token')).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear localStorage and navigate to login', () => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockLoginResponse.user));

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from localStorage', () => {
      const userStr = JSON.stringify(mockLoginResponse.user);
      localStorage.setItem('user', userStr);

      const user = service.getCurrentUser();

      expect(user).toBeTruthy();
      expect(user?.email).toBe(mockLoginResponse.user.email);
      expect(user?.id).toBe(mockLoginResponse.user.id);
    });

    it('should return null when no user in localStorage', () => {
      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return null when user data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');

      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      // Create a valid token (not expired)
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      localStorage.setItem('access_token', validToken);

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      // Create an expired token
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      localStorage.setItem('access_token', expiredToken);

      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', 'mock-token');

      const token = service.getToken();

      expect(token).toBe('mock-token');
    });

    it('should return null when no token exists', () => {
      const token = service.getToken();

      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when no token exists', () => {
      const result = service.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      localStorage.setItem('access_token', validToken);

      const result = service.isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true when token is expired', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      localStorage.setItem('access_token', expiredToken);

      const result = service.isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when token is invalid', () => {
      localStorage.setItem('access_token', 'invalid-token');

      const result = service.isTokenExpired();

      expect(result).toBe(true);
    });
  });
});
