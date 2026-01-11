import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard } from '../../src/app/guards/auth.guard';
import { AuthService } from '../../src/app/services/auth.service';

describe('Auth Guards', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
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

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call isAuthenticated method', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => guestGuard(null as any, null as any));

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to dashboard when user is authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => guestGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should call isAuthenticated method', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      TestBed.runInInjectionContext(() => guestGuard(null as any, null as any));

      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should protect login page from authenticated users', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => guestGuard(null as any, null as any));

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
