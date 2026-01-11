import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload, TaskStatus } from '@vmekala/data';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;
  let auditService: AuditService;

  const mockTaskService = {
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  };

  const mockAuditService = {
    getAuditLogs: jest.fn(),
  };

  const mockJwtPayload: JwtPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    roles: ['ADMIN'],
    permissions: ['CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: 'Work',
    organizationId: 'org-1',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /tasks', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task Description',
      status: TaskStatus.TODO,
      category: 'Work',
    };

    it('should create task successfully', async () => {
      mockTaskService.createTask.mockResolvedValue(mockTask);

      const result = await controller.createTask(createTaskDto, mockJwtPayload);

      expect(result).toEqual(mockTask);
      expect(mockTaskService.createTask).toHaveBeenCalledWith(
        createTaskDto,
        'user-1',
        'org-1'
      );
    });

    it('should throw BadRequestException when user has no organizationId', async () => {
      const userWithoutOrg = { ...mockJwtPayload, organizationId: undefined };

      await expect(
        controller.createTask(createTaskDto, userWithoutOrg as any)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.createTask(createTaskDto, userWithoutOrg as any)
      ).rejects.toThrow('User must belong to an organization');
    });

    it('should handle service errors', async () => {
      mockTaskService.createTask.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        controller.createTask(createTaskDto, mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks for user organization', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 'task-2' }];
      mockTaskService.getTasks.mockResolvedValue(mockTasks);

      const result = await controller.getTasks({}, mockJwtPayload);

      expect(result).toEqual(mockTasks);
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        {}
      );
    });

    it('should apply filters when provided', async () => {
      const filters = { status: TaskStatus.IN_PROGRESS, category: 'Personal' };
      mockTaskService.getTasks.mockResolvedValue([mockTask]);

      const result = await controller.getTasks(filters, mockJwtPayload);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        'user-1',
        'org-1',
        filters
      );
    });

    it('should throw BadRequestException when user has no organizationId', async () => {
      const userWithoutOrg = { ...mockJwtPayload, organizationId: undefined };

      await expect(
        controller.getTasks({}, userWithoutOrg as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /tasks/audit-log', () => {
    it('should return audit logs for OWNER', async () => {
      const ownerPayload = { ...mockJwtPayload, roles: ['OWNER'] };
      const mockAuditLogs = [
        {
          id: 'log-1',
          action: 'CREATE' as const,
          userId: 'user-1',
          organizationId: 'org-1',
          resource: 'Task' as const,
          resourceId: 'task-1',
          timestamp: new Date(),
        },
      ];

      mockAuditService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(undefined, undefined, ownerPayload);

      expect(result).toEqual(mockAuditLogs);
      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(50, 0);
    });

    it('should return audit logs for ADMIN', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          action: 'UPDATE' as const,
          userId: 'user-1',
          organizationId: 'org-1',
          resource: 'Task' as const,
          resourceId: 'task-1',
          timestamp: new Date(),
        },
      ];

      mockAuditService.getAuditLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getAuditLogs(undefined, undefined, mockJwtPayload);

      expect(result).toEqual(mockAuditLogs);
    });

    it('should respect limit parameter', async () => {
      mockAuditService.getAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs('25', undefined, mockJwtPayload);

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(25, 0);
    });

    it('should respect offset parameter', async () => {
      mockAuditService.getAuditLogs.mockResolvedValue([]);

      await controller.getAuditLogs(undefined, '10', mockJwtPayload);

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(50, 10);
    });

    it('should throw BadRequestException for invalid limit', async () => {
      await expect(
        controller.getAuditLogs('invalid', undefined, mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getAuditLogs('invalid', undefined, mockJwtPayload)
      ).rejects.toThrow('Limit must be a positive number');
    });

    it('should throw BadRequestException for limit exceeding 100', async () => {
      await expect(
        controller.getAuditLogs('150', undefined, mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getAuditLogs('150', undefined, mockJwtPayload)
      ).rejects.toThrow('Limit cannot exceed 100');
    });

    it('should throw BadRequestException for negative offset', async () => {
      await expect(
        controller.getAuditLogs(undefined, '-5', mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getAuditLogs(undefined, '-5', mockJwtPayload)
      ).rejects.toThrow('Offset must be a non-negative number');
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return task by id', async () => {
      mockTaskService.getTaskById.mockResolvedValue(mockTask);

      const result = await controller.getTaskById('task-1', mockJwtPayload);

      expect(result).toEqual(mockTask);
      expect(mockTaskService.getTaskById).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        'org-1'
      );
    });

    it('should throw BadRequestException for empty id', async () => {
      await expect(
        controller.getTaskById('', mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.getTaskById('', mockJwtPayload)
      ).rejects.toThrow('Task ID is required');
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskService.getTaskById.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.getTaskById('nonexistent', mockJwtPayload)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PUT /tasks/:id', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Title',
      status: TaskStatus.DONE,
    };

    it('should update task successfully', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const result = await controller.updateTask('task-1', updateTaskDto, mockJwtPayload);

      expect(result).toEqual(updatedTask);
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        'task-1',
        updateTaskDto,
        'user-1',
        'org-1'
      );
    });

    it('should throw BadRequestException when no fields provided', async () => {
      const emptyDto: UpdateTaskDto = {};

      await expect(
        controller.updateTask('task-1', emptyDto, mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.updateTask('task-1', emptyDto, mockJwtPayload)
      ).rejects.toThrow('At least one field must be provided for update');
    });

    it('should throw BadRequestException for empty id', async () => {
      await expect(
        controller.updateTask('', updateTaskDto, mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete task successfully', async () => {
      mockTaskService.deleteTask.mockResolvedValue({ success: true });

      const result = await controller.deleteTask('task-1', mockJwtPayload);

      expect(result).toEqual({ success: true });
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        'org-1'
      );
    });

    it('should throw BadRequestException for empty id', async () => {
      await expect(
        controller.deleteTask('', mockJwtPayload)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.deleteTask('', mockJwtPayload)
      ).rejects.toThrow('Task ID is required');
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskService.deleteTask.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.deleteTask('nonexistent', mockJwtPayload)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
