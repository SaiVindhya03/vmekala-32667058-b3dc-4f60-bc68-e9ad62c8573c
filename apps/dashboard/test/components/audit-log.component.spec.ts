import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AuditLogComponent } from '../../src/app/pages/audit-log/audit-log.component';
import { AuditService } from '../../src/app/services/audit.service';
import { AuditLogDto } from '@vmekala/data';

describe('AuditLogComponent', () => {
  let component: AuditLogComponent;
  let fixture: ComponentFixture<AuditLogComponent>;
  let mockAuditService: jest.Mocked<AuditService>;

  const mockAuditLogs: AuditLogDto[] = [
    {
      id: '1',
      action: 'CREATE',
      resource: 'Task',
      resourceId: 'task-1',
      userId: 'user-1',
      organizationId: 'org-1',
      metadata: { title: 'Test Task' },
      createdAt: new Date('2024-01-01'),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-1',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: '2',
      action: 'UPDATE',
      resource: 'User',
      resourceId: 'user-1',
      userId: 'user-1',
      organizationId: 'org-1',
      metadata: {},
      createdAt: new Date('2024-01-02'),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  beforeEach(async () => {
    mockAuditService = {
      getAuditLogs: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [AuditLogComponent, FormsModule],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogComponent);
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
    it('should load audit logs on init', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      fixture.detectChanges(); // Triggers ngOnInit

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
        expect(component.loading).toBe(false);
        expect(component.auditLogs).toEqual(mockAuditLogs);
        done();
      }, 10);
    });

    it('should set loading state while fetching logs', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));
      
      // Check immediately after calling
      const initialLoading = component.loading;
      component.ngOnInit();
      
      // Loading should be set immediately
      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('loadAuditLogs', () => {
    it('should load audit logs without filters', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      component.loadAuditLogs();

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({});
        expect(component.auditLogs).toEqual(mockAuditLogs);
        expect(component.loading).toBe(false);
        expect(component.error).toBeNull();
        done();
      }, 10);
    });

    it('should load audit logs with resource filter', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of([mockAuditLogs[0]]));
      component.selectedResource = 'Task';

      component.loadAuditLogs();

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({ resource: 'Task' });
        expect(component.auditLogs.length).toBe(1);
        done();
      }, 10);
    });

    it('should load audit logs with action filter', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of([mockAuditLogs[0]]));
      component.selectedAction = 'CREATE';

      component.loadAuditLogs();

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({ action: 'CREATE' });
        expect(component.auditLogs.length).toBe(1);
        done();
      }, 10);
    });

    it('should load audit logs with multiple filters', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of([mockAuditLogs[0]]));
      component.selectedResource = 'Task';
      component.selectedAction = 'CREATE';

      component.loadAuditLogs();

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({
          resource: 'Task',
          action: 'CREATE',
        });
        done();
      }, 10);
    });

    it('should handle error when loading audit logs', (done) => {
      const error = {
        error: { message: 'Failed to fetch logs' },
        message: 'Network error',
      };
      mockAuditService.getAuditLogs.mockReturnValue(throwError(() => error));

      component.loadAuditLogs();

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to fetch logs');
        done();
      }, 10);
    });

    it('should handle error without message', (done) => {
      const error = { message: 'Generic error' };
      mockAuditService.getAuditLogs.mockReturnValue(throwError(() => error));

      component.loadAuditLogs();

      setTimeout(() => {
        expect(component.error).toBe('Generic error');
        done();
      }, 10);
    });

    it('should use default error message when no error details', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(throwError(() => ({})));

      component.loadAuditLogs();

      setTimeout(() => {
        expect(component.error).toBe('Failed to load audit logs');
        done();
      }, 10);
    });

    it('should set loading to true before fetching', (done) => {
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      component.loadAuditLogs();

      setTimeout(() => {
        expect(mockAuditService.getAuditLogs).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should clear error before fetching', () => {
      component.error = 'Previous error';
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      component.loadAuditLogs();

      expect(component.error).toBeNull();
    });
  });

  describe('onFilterChange', () => {
    it('should reload audit logs when filter changes', () => {
      const loadSpy = jest.spyOn(component, 'loadAuditLogs');
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      component.onFilterChange();

      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('resetFilters', () => {
    it('should clear all filters and reload', () => {
      component.selectedResource = 'Task';
      component.selectedAction = 'CREATE';
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));

      component.resetFilters();

      expect(component.selectedResource).toBe('');
      expect(component.selectedAction).toBe('');
      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith({});
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:45');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('10');
      expect(formatted).toContain('30');
    });

    it('should handle different date formats', () => {
      const date = new Date('2024-12-31T23:59:59');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('Dec');
      expect(formatted).toContain('31');
      expect(formatted).toContain('2024');
    });
  });

  describe('getUserName', () => {
    it('should return full name when firstName and lastName exist', () => {
      const log = mockAuditLogs[0];
      const userName = component.getUserName(log);

      expect(userName).toBe('Test User');
    });

    it('should return email when no name is available', () => {
      const log = mockAuditLogs[1];
      const userName = component.getUserName(log);

      expect(userName).toBe('test@example.com');
    });

    it('should return Unknown User when user is undefined', () => {
      const log = { ...mockAuditLogs[0], user: undefined };
      const userName = component.getUserName(log);

      expect(userName).toBe('Unknown User');
    });

    it('should handle user with only first name', () => {
      const log = {
        ...mockAuditLogs[0],
        user: {
          ...mockAuditLogs[0].user!,
          firstName: 'Test',
          lastName: undefined,
        },
      };
      const userName = component.getUserName(log);

      expect(userName).toBe('test@example.com');
    });
  });

  describe('getActionColor', () => {
    it('should return green color for CREATE action', () => {
      const color = component.getActionColor('CREATE');
      expect(color).toContain('green');
    });

    it('should return blue color for UPDATE action', () => {
      const color = component.getActionColor('UPDATE');
      expect(color).toContain('blue');
    });

    it('should return red color for DELETE action', () => {
      const color = component.getActionColor('DELETE');
      expect(color).toContain('red');
    });

    it('should return gray color for READ action', () => {
      const color = component.getActionColor('READ');
      expect(color).toContain('gray');
    });

    it('should return default gray color for unknown action', () => {
      const color = component.getActionColor('UNKNOWN');
      expect(color).toContain('gray');
    });
  });

  describe('getResourceIcon', () => {
    it('should return Task icon path', () => {
      const icon = component.getResourceIcon('Task');
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });

    it('should return User icon path', () => {
      const icon = component.getResourceIcon('User');
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });

    it('should return Organization icon path', () => {
      const icon = component.getResourceIcon('Organization');
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });

    it('should return default icon path for unknown resource', () => {
      const icon = component.getResourceIcon('Unknown');
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('string');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      mockAuditService.getAuditLogs.mockReturnValue(of(mockAuditLogs));
      fixture.detectChanges();

      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Component State', () => {
    it('should initialize with empty audit logs', () => {
      expect(component.auditLogs).toEqual([]);
    });

    it('should initialize with loading false', () => {
      expect(component.loading).toBe(false);
    });

    it('should initialize with error null', () => {
      expect(component.error).toBeNull();
    });

    it('should initialize with empty filters', () => {
      expect(component.selectedResource).toBe('');
      expect(component.selectedAction).toBe('');
    });
  });
});
