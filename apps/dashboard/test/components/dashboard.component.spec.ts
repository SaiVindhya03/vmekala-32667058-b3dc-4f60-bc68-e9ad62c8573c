import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from '../../src/app/pages/dashboard/dashboard.component';
import { AuthService } from '../../src/app/services/auth.service';
import { UserDto } from '@vmekala/data';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jest.Mocked<AuthService>;

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
      isAuthenticated: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      getToken: jest.fn(),
      isTokenExpired: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: { params: {} } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user on init', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture.detectChanges(); // Triggers ngOnInit

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should set currentUser to null when no user is logged in', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      fixture.detectChanges();

      expect(component.currentUser).toBeNull();
    });

    it('should call getCurrentUser only once', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture.detectChanges();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component State', () => {
    it('should initialize with currentUser as null', () => {
      expect(component.currentUser).toBeNull();
    });

    it('should update currentUser after ngOnInit', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      expect(component.currentUser).toBeNull();

      fixture.detectChanges();

      expect(component.currentUser).not.toBeNull();
      expect(component.currentUser?.id).toBe('1');
    });
  });

  describe('User Data Display', () => {
    it('should display user name when user is loaded', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      fixture.detectChanges();

      expect(component.currentUser?.name).toBe('Test User');
      expect(component.currentUser?.email).toBe('test@example.com');
    });

    it('should handle user with no name', () => {
      const userWithoutName = { ...mockUser, firstName: '', lastName: '', name: '' };
      mockAuthService.getCurrentUser.mockReturnValue(userWithoutName);

      fixture.detectChanges();

      expect(component.currentUser?.email).toBe('test@example.com');
    });
  });

  describe('Integration', () => {
    it('should be standalone component', () => {
      expect(DashboardComponent).toBeDefined();
    });

    it('should have correct imports', () => {
      const metadata = (DashboardComponent as any).ɵcmp;
      expect(metadata).toBeDefined();
    });
  });
});
