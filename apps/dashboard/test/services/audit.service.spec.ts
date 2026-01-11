import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditService } from '../../src/app/services/audit.service';
import { AuditLogDto } from '@vmekala/data';
import { environment } from '../../src/environments/environment';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  const mockAuditLog: AuditLogDto = {
    id: '1',
    action: 'CREATE',
    resource: 'Task',
    resourceId: 'task-1',
    userId: 'user-1',
    organizationId: 'org-1',
    metadata: { oldValue: null, newValue: { title: 'Test Task' } },
    createdAt: new Date(),
  };

  const mockAuditLogs: AuditLogDto[] = [
    mockAuditLog,
    {
      ...mockAuditLog,
      id: '2',
      action: 'UPDATE',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditService],
    });

    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuditLogs', () => {
    it('should retrieve all audit logs without filters', (done) => {
      service.getAuditLogs().subscribe({
        next: (logs) => {
          expect(logs).toEqual(mockAuditLogs);
          expect(logs.length).toBe(2);
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockAuditLogs);
    });

    it('should retrieve audit logs with resource filter', (done) => {
      service.getAuditLogs({ resource: 'Task' }).subscribe({
        next: (logs) => {
          expect(logs).toBeTruthy();
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne((request) => {
        return request.url === apiUrl &&
               request.params.get('resource') === 'Task';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockAuditLog]);
    });

    it('should retrieve audit logs with action filter', (done) => {
      service.getAuditLogs({ action: 'CREATE' }).subscribe({
        next: (logs) => {
          expect(logs).toBeTruthy();
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne((request) => {
        return request.url === apiUrl &&
               request.params.get('action') === 'CREATE';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockAuditLog]);
    });

    it('should retrieve audit logs with userId filter', (done) => {
      service.getAuditLogs({ userId: 'user-1' }).subscribe({
        next: (logs) => {
          expect(logs).toBeTruthy();
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne((request) => {
        return request.url === apiUrl &&
               request.params.get('userId') === 'user-1';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockAuditLog]);
    });

    it('should retrieve audit logs with multiple filters', (done) => {
      const filters = {
        resource: 'Task' as const,
        action: 'CREATE' as const,
        userId: 'user-1',
      };

      service.getAuditLogs(filters).subscribe({
        next: (logs) => {
          expect(logs).toBeTruthy();
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne((request) => {
        return request.url === apiUrl &&
               request.params.get('resource') === 'Task' &&
               request.params.get('action') === 'CREATE' &&
               request.params.get('userId') === 'user-1';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockAuditLog]);
    });

    it('should handle empty audit logs response', (done) => {
      service.getAuditLogs().subscribe({
        next: (logs) => {
          expect(logs).toEqual([]);
          expect(logs.length).toBe(0);
          done();
        },
      });

      const apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;
      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });
});
