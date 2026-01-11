import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { NavbarComponent } from '../../src/app/layout/navbar/navbar.component';
import { AuthService } from '../../src/app/services/auth.service';
import { UserDto } from '@vmekala/data';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: UserDto = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    organizationId: 'org-1',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      getCurrentUser: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: jest.fn(),
      login: jest.fn(),
      getToken: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    // Clear localStorage before each test
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    
    // Override router after TestBed setup
    mockRouter = TestBed.inject(Router) as any;
    jest.spyOn(mockRouter, 'navigate');

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Constructor', () => {
    it('should load current user on construction', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture.detectChanges();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component['currentUser']).toEqual(mockUser);
    });

    it('should initialize user menu as closed', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture.detectChanges();

      expect(component['isUserMenuOpen']()).toBe(false);
    });

    it('should load dark mode from localStorage', () => {
      localStorage.clear();
      localStorage.setItem('darkMode', 'true');
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      // Create new fixture to trigger constructor
      const newFixture = TestBed.createComponent(NavbarComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent['isDarkMode']()).toBe(true);
    });

    it('should default to light mode when no preference saved', () => {
      localStorage.clear();
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      // Create new fixture to trigger constructor
      const newFixture = TestBed.createComponent(NavbarComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent['isDarkMode']()).toBe(false);
    });

    it('should add dark class to document when dark mode is saved', () => {
      localStorage.clear();
      localStorage.setItem('darkMode', 'true');
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      document.documentElement.classList.remove('dark');

      // Create new fixture to trigger constructor
      TestBed.createComponent(NavbarComponent);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('toggleUserMenu', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('should toggle user menu from closed to open', () => {
      expect(component['isUserMenuOpen']()).toBe(false);

      component['toggleUserMenu']();

      expect(component['isUserMenuOpen']()).toBe(true);
    });

    it('should toggle user menu from open to closed', () => {
      component['isUserMenuOpen'].set(true);

      component['toggleUserMenu']();

      expect(component['isUserMenuOpen']()).toBe(false);
    });

    it('should toggle multiple times', () => {
      component['toggleUserMenu']();
      expect(component['isUserMenuOpen']()).toBe(true);

      component['toggleUserMenu']();
      expect(component['isUserMenuOpen']()).toBe(false);

      component['toggleUserMenu']();
      expect(component['isUserMenuOpen']()).toBe(true);
    });
  });

  describe('toggleMobileMenu', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('should emit mobileMenuToggle event', () => {
      const emitSpy = jest.fn();
      component.mobileMenuToggle.subscribe(emitSpy);

      component['toggleMobileMenu']();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('toggleDarkMode', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('darkMode');
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('should enable dark mode when currently light', () => {
      component['toggleDarkMode']();

      expect(component['isDarkMode']()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('darkMode')).toBe('true');
    });

    it('should disable dark mode when currently dark', () => {
      component['isDarkMode'].set(true);
      document.documentElement.classList.add('dark');

      component['toggleDarkMode']();

      expect(component['isDarkMode']()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('darkMode')).toBe('false');
    });

    it('should toggle dark mode multiple times', () => {
      component['toggleDarkMode']();
      expect(component['isDarkMode']()).toBe(true);

      component['toggleDarkMode']();
      expect(component['isDarkMode']()).toBe(false);

      component['toggleDarkMode']();
      expect(component['isDarkMode']()).toBe(true);
    });
  });

  describe('closeUserMenu', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture.detectChanges();
    });

    it('should close user menu', () => {
      component['isUserMenuOpen'].set(true);

      component['closeUserMenu']();

      expect(component['isUserMenuOpen']()).toBe(false);
    });

    it('should do nothing when menu is already closed', () => {
      component['isUserMenuOpen'].set(false);

      component['closeUserMenu']();

      expect(component['isUserMenuOpen']()).toBe(false);
    });
  });

  describe('navigateToProfile', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('should navigate to profile page', () => {
      component['navigateToProfile']();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should close user menu before navigating', () => {
      component['isUserMenuOpen'].set(true);

      component['navigateToProfile']();

      expect(component['isUserMenuOpen']()).toBe(false);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;
    });

    it('should call authService logout', () => {
      component['logout']();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should close user menu before logging out', () => {
      component['isUserMenuOpen'].set(true);

      component['logout']();

      expect(component['isUserMenuOpen']()).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return full name when firstName and lastName are available', () => {
      component['currentUser'] = mockUser;

      const displayName = component['getUserDisplayName']();

      expect(displayName).toBe('Test User');
    });

    it('should return email when firstName and lastName are empty', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: '',
        lastName: '',
      };

      const displayName = component['getUserDisplayName']();

      expect(displayName).toBe('test@example.com');
    });

    it('should return Guest when no user is logged in', () => {
      component['currentUser'] = null;

      const displayName = component['getUserDisplayName']();

      expect(displayName).toBe('Guest');
    });

    it('should trim whitespace from full name', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: '  Test  ',
        lastName: '  User  ',
      };

      const displayName = component['getUserDisplayName']();

      expect(displayName).toBe('Test  User');
    });
  });

  describe('getUserInitials', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
    });

    it('should return initials from firstName and lastName', () => {
      component['currentUser'] = mockUser;

      const initials = component['getUserInitials']();

      expect(initials).toBe('TU');
    });

    it('should return first letter of email when no names available', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: undefined,
        lastName: undefined,
      };

      const initials = component['getUserInitials']();

      expect(initials).toBe('T');
    });

    it('should return G when no user is logged in', () => {
      component['currentUser'] = null;

      const initials = component['getUserInitials']();

      expect(initials).toBe('G');
    });

    it('should return uppercase initials', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: 'john',
        lastName: 'doe',
      };

      const initials = component['getUserInitials']();

      expect(initials).toBe('JD');
    });

    it('should handle missing firstName', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: undefined,
        lastName: 'User',
      };

      const initials = component['getUserInitials']();

      expect(initials).toBe('U');
    });

    it('should handle missing lastName', () => {
      component['currentUser'] = {
        ...mockUser,
        firstName: 'Test',
        lastName: undefined,
      };

      const initials = component['getUserInitials']();

      expect(initials).toBe('T');
    });
  });

  describe('Signals', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture.detectChanges();
    });

    it('should use signal for isUserMenuOpen', () => {
      expect(typeof component['isUserMenuOpen']).toBe('function');
      expect(component['isUserMenuOpen']()).toBe(false);
    });

    it('should use signal for isDarkMode', () => {
      expect(typeof component['isDarkMode']).toBe('function');
      expect(component['isDarkMode']()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no email', () => {
      const userWithoutEmail = {
        ...mockUser,
        email: '',
      };
      mockAuthService.getCurrentUser.mockReturnValue(userWithoutEmail);

      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;

      const displayName = component['getUserDisplayName']();
      expect(displayName).toBe('Test User');
    });

    it('should handle toggling dark mode rapidly', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      fixture = TestBed.createComponent(NavbarComponent);
      component = fixture.componentInstance;

      for (let i = 0; i < 10; i++) {
        component['toggleDarkMode']();
      }

      expect(component['isDarkMode']()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
