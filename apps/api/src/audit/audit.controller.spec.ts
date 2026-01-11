import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogDto } from '@vmekala/data';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  const mockAuditService = {
    getLogs: jest.fn(),
    getAuditLogs: jest.fn(),
  };

  const mockAuditLog: AuditLogDto = {
    id: 'log-1',
    action: 'CREATE',
    userId: 'user-1',
    organizationId: 'org-1',
    resource: 'Task',
    resourceId: 'task-1',
    timestamp: new Date(),
    changes: { title: 'New Task' },
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  const mockRequest = {
    user: {
      userId: 'user-1',
      email: 'test@example.com',
      organizationId: 'org-1',
      roles: ['ADMIN'],
      permissions: ['CREATE_TASK', 'READ_TASK', 'VIEW_AUDIT'],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /audit-logs', () => {
    it('should return audit logs for user organization', async () => {
      const mockLogs = [mockAuditLog, { ...mockAuditLog, id: 'log-2' }];
      mockAuditService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAuditLogs(mockRequest);

      expect(result).toEqual(mockLogs);
      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {});
    });

    it('should filter by resource when provided', async () => {
      mockAuditService.getLogs.mockResolvedValue([mockAuditLog]);

      await controller.getAuditLogs(mockRequest, 'Task');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        resource: 'Task',
      });
    });

    it('should filter by action when provided', async () => {
      mockAuditService.getLogs.mockResolvedValue([mockAuditLog]);

      await controller.getAuditLogs(mockRequest, undefined, 'CREATE');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        action: 'CREATE',
      });
    });

    it('should filter by userId when provided', async () => {
      mockAuditService.getLogs.mockResolvedValue([mockAuditLog]);

      await controller.getAuditLogs(mockRequest, undefined, undefined, 'user-2');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        userId: 'user-2',
      });
    });

    it('should apply multiple filters', async () => {
      mockAuditService.getLogs.mockResolvedValue([mockAuditLog]);

      await controller.getAuditLogs(mockRequest, 'Task', 'UPDATE', 'user-1');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        resource: 'Task',
        action: 'UPDATE',
        userId: 'user-1',
      });
    });

    it('should return empty array when no logs match filters', async () => {
      mockAuditService.getLogs.mockResolvedValue([]);

      const result = await controller.getAuditLogs(mockRequest, 'User');

      expect(result).toEqual([]);
    });

    it('should handle different resource types', async () => {
      const userLog = { ...mockAuditLog, resource: 'User' as const };
      mockAuditService.getLogs.mockResolvedValue([userLog]);

      await controller.getAuditLogs(mockRequest, 'User');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        resource: 'User',
      });
    });

    it('should handle different action types', async () => {
      const deleteLog = { ...mockAuditLog, action: 'DELETE' as const };
      mockAuditService.getLogs.mockResolvedValue([deleteLog]);

      await controller.getAuditLogs(mockRequest, undefined, 'DELETE');

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-1', {
        action: 'DELETE',
      });
    });

    it('should work with different organizations', async () => {
      const org2Request = {
        user: {
          ...mockRequest.user,
          organizationId: 'org-2',
        },
      };

      mockAuditService.getLogs.mockResolvedValue([]);

      await controller.getAuditLogs(org2Request);

      expect(mockAuditService.getLogs).toHaveBeenCalledWith('org-2', {});
    });
  });
});
