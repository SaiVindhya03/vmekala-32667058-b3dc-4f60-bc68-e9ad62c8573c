import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from '../../src/app/pages/profile/profile.component';
import { AuthService } from '../../src/app/services/auth.service';
import { UserDto } from '@vmekala/data';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jest.Mocked<AuthService>;

  const mockUser: UserDto = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    organizationId: 'org-1',
    roles: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    mockAuthService = {
      getCurrentUser: jest.fn().mockReturnValue(null),
      isAuthenticated: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      getToken: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: { params: {} } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    mockAuthService.getCurrentUser.mockReturnValue(null);
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    
    expect(component).toBeTruthy();
  });

  describe('Constructor', () => {
    it('should load current user on construction', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component['currentUser']).toEqual(mockUser);
    });

    it('should set currentUser to null when no user is logged in', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']).toBeNull();
    });

    it('should call getCurrentUser only once', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      
      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component State', () => {
    it('should store user data correctly', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.id).toBe('1');
      expect(component['currentUser']?.email).toBe('test@example.com');
      expect(component['currentUser']?.firstName).toBe('Test');
      expect(component['currentUser']?.lastName).toBe('User');
    });

    it('should handle user without firstName or lastName', () => {
      const userWithoutNames = {
        ...mockUser,
        firstName: undefined,
        lastName: undefined,
        name: '',
      };
      mockAuthService.getCurrentUser.mockReturnValue(userWithoutNames);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.email).toBe('test@example.com');
    });

    it('should store organization ID', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.organizationId).toBe('org-1');
    });
  });

  describe('User Roles', () => {
    it('should store empty roles array when no roles assigned', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.roles).toEqual([]);
    });

    it('should store roles when user has roles', () => {
      const userWithRoles = {
        ...mockUser,
        roles: ['ADMIN', 'USER'],
      };
      mockAuthService.getCurrentUser.mockReturnValue(userWithRoles);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.roles).toEqual(['ADMIN', 'USER']);
    });
  });

  describe('Date Fields', () => {
    it('should store createdAt date', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should store updatedAt date', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.updatedAt).toEqual(new Date('2024-01-02'));
    });
  });

  describe('Integration', () => {
    it('should be standalone component', () => {
      expect(ProfileComponent).toBeDefined();
    });

    it('should have correct component metadata', () => {
      const metadata = (ProfileComponent as any).ɵcmp;
      expect(metadata).toBeDefined();
    });

    it('should work with null user', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      expect(() => {
        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
      }).not.toThrow();
    });
  });

  describe('User Data Display', () => {
    it('should provide access to user email', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.email).toBe('test@example.com');
    });

    it('should provide access to user name', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.name).toBe('Test User');
    });

    it('should provide access to user ID', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.id).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with all fields populated', () => {
      const fullUser: UserDto = {
        id: '1',
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'User',
        name: 'Full User',
        organizationId: 'org-1',
        roles: ['ADMIN', 'OWNER'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAuthService.getCurrentUser.mockReturnValue(fullUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']).toEqual(fullUser);
    });

    it('should handle user with minimal fields', () => {
      const minimalUser: UserDto = {
        id: '1',
        email: 'minimal@example.com',
        organizationId: 'org-1',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAuthService.getCurrentUser.mockReturnValue(minimalUser);

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;

      expect(component['currentUser']?.email).toBe('minimal@example.com');
    });
  });
});
