import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepository: Repository<AuditLog>;

  const mockAuditLog = {
    id: 'log-1',
    action: 'CREATE' as const,
    userId: 'user-1',
    organizationId: 'org-1',
    resource: 'Task' as const,
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

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog)
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save audit log', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockAuditLogRepository.create.mockReturnValue(mockAuditLog);
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(
        'CREATE',
        'user-1',
        'org-1',
        'Task',
        'task-1',
        { title: 'New Task' }
      );

      expect(result).toEqual(mockAuditLog);
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        action: 'CREATE',
        userId: 'user-1',
        organizationId: 'org-1',
        resource: 'Task',
        resourceId: 'task-1',
        changes: { title: 'New Task' },
        timestamp: expect.any(Date),
      });
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should log UPDATE action with changes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const changes = {
        title: { old: 'Old Title', new: 'New Title' },
        status: { old: 'todo', new: 'done' },
      };

      mockAuditLogRepository.create.mockReturnValue({ ...mockAuditLog, action: 'UPDATE' });
      mockAuditLogRepository.save.mockResolvedValue({ ...mockAuditLog, action: 'UPDATE' });

      await service.log('UPDATE', 'user-1', 'org-1', 'Task', 'task-1', changes);

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          changes,
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log DELETE action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockAuditLogRepository.create.mockReturnValue({ ...mockAuditLog, action: 'DELETE' });
      mockAuditLogRepository.save.mockResolvedValue({ ...mockAuditLog, action: 'DELETE' });

      await service.log('DELETE', 'user-1', 'org-1', 'Task', 'task-1');

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log READ action', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockAuditLogRepository.create.mockReturnValue({ ...mockAuditLog, action: 'READ' });
      mockAuditLogRepository.save.mockResolvedValue({ ...mockAuditLog, action: 'READ' });

      await service.log('READ', 'user-1', 'org-1', 'Task', 'task-1');

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'READ',
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getLogs', () => {
    it('should return logs for organization', async () => {
      const mockLogs = [mockAuditLog, { ...mockAuditLog, id: 'log-2' }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getLogs('org-1');

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'audit_log.organizationId = :organizationId',
        { organizationId: 'org-1' }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'audit_log.timestamp',
        'DESC'
      );
    });

    it('should filter by userId when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getLogs('org-1', { userId: 'user-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.userId = :userId',
        { userId: 'user-1' }
      );
    });

    it('should filter by resource when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getLogs('org-1', { resource: 'Task' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.resource = :resource',
        { resource: 'Task' }
      );
    });

    it('should filter by action when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getLogs('org-1', { action: 'CREATE' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.action = :action',
        { action: 'CREATE' }
      );
    });

    it('should apply multiple filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getLogs('org-1', {
        userId: 'user-1',
        resource: 'Task',
        action: 'UPDATE',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('getLogsByResource', () => {
    it('should return logs for specific resource', async () => {
      const mockLogs = [mockAuditLog];
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getLogsByResource('Task', 'task-1');

      expect(result).toEqual(mockLogs);
      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        where: { resource: 'Task', resourceId: 'task-1' },
        order: { timestamp: 'DESC' },
        relations: ['user'],
      });
    });

    it('should return empty array when no logs found', async () => {
      mockAuditLogRepository.find.mockResolvedValue([]);

      const result = await service.getLogsByResource('Task', 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getLogsByUser', () => {
    it('should return logs for specific user', async () => {
      const mockLogs = [mockAuditLog, { ...mockAuditLog, id: 'log-2' }];
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getLogsByUser('user-1');

      expect(result).toEqual(mockLogs);
      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { timestamp: 'DESC' },
      });
    });

    it('should return empty array when user has no logs', async () => {
      mockAuditLogRepository.find.mockResolvedValue([]);

      const result = await service.getLogsByUser('user-no-logs');

      expect(result).toEqual([]);
    });
  });

  describe('getAuditLogs', () => {
    it('should return logs with default pagination', async () => {
      const mockLogs = Array(50).fill(mockAuditLog).map((log, i) => ({
        ...log,
        id: `log-${i}`,
      }));
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs();

      expect(result).toHaveLength(50);
      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 50,
        skip: 0,
      });
    });

    it('should respect custom limit', async () => {
      const mockLogs = Array(10).fill(mockAuditLog).map((log, i) => ({
        ...log,
        id: `log-${i}`,
      }));
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs(10, 0);

      expect(result).toHaveLength(10);
      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 10,
        skip: 0,
      });
    });

    it('should respect custom offset', async () => {
      const mockLogs = Array(50).fill(mockAuditLog).map((log, i) => ({
        ...log,
        id: `log-${i + 20}`,
      }));
      mockAuditLogRepository.find.mockResolvedValue(mockLogs);

      await service.getAuditLogs(50, 20);

      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        take: 50,
        skip: 20,
      });
    });

    it('should return empty array when no logs exist', async () => {
      mockAuditLogRepository.find.mockResolvedValue([]);

      const result = await service.getAuditLogs();

      expect(result).toEqual([]);
    });
  });
});
