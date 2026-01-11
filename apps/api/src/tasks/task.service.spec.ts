import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { TaskStatus, Permission, Role } from '@vmekala/data';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let usersService: UsersService;
  let auditService: AuditService;

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo' as const,
    category: 'Work',
    organizationId: 'org-1',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUsersService = {
    getById: jest.fn(),
    getUserRoles: jest.fn(),
    getUserPermissions: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    usersService = module.get<UsersService>(UsersService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Task Description',
      status: TaskStatus.TODO,
      category: 'Work',
    };

    it('should create task when user has permission', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.CREATE_TASK]);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.createTask(createTaskDto, 'user-1', 'org-1');

      expect(result).toMatchObject({
        id: 'task-1',
        title: 'Test Task',
        status: TaskStatus.TODO,
      });
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'CREATE',
        'user-1',
        'org-1',
        'Task',
        'task-1',
        expect.any(Object)
      );
    });

    it('should throw ForbiddenException when user not in organization', async () => {
      mockUsersService.getById.mockResolvedValue({
        ...mockUser,
        organizationId: 'org-2',
      });

      await expect(
        service.createTask(createTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createTask(createTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow('User does not belong to the specified organization');
    });

    it('should throw ForbiddenException when user lacks CREATE_TASK permission', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);

      await expect(
        service.createTask(createTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createTask(createTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow('User does not have CREATE_TASK permission');
    });

    it('should use default values when optional fields not provided', async () => {
      const minimalDto: CreateTaskDto = {
        title: 'Minimal Task',
        description: 'Description',
      };

      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.CREATE_TASK]);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockAuditService.log.mockResolvedValue({});

      await service.createTask(minimalDto, 'user-1', 'org-1');

      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Minimal Task',
          description: 'Description',
          status: TaskStatus.TODO,
          category: 'Work',
        })
      );
    });
  });

  describe('getTasks', () => {
    it('should return tasks for user organization', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 'task-2' }];
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTasks('user-1', 'org-1');

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.organizationId = :organizationId',
        { organizationId: 'org-1' }
      );
    });

    it('should apply status filter when provided', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTask]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTasks('user-1', 'org-1', { status: TaskStatus.TODO });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.TODO }
      );
    });

    it('should apply category filter when provided', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTask]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTasks('user-1', 'org-1', { category: 'Personal' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.category = :category',
        { category: 'Personal' }
      );
    });

    it('should throw ForbiddenException when user lacks READ_TASK permission', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([]);

      await expect(service.getTasks('user-1', 'org-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getTaskById', () => {
    it('should return task when user has permission and task in organization', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.getTaskById('task-1', 'user-1', 'org-1');

      expect(result.id).toBe('task-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'READ',
        'user-1',
        'org-1',
        'Task',
        'task-1'
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTaskById('nonexistent', 'user-1', 'org-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when task in different organization', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.READ_TASK]);
      mockTaskRepository.findOne.mockResolvedValue({
        ...mockTask,
        organizationId: 'org-2',
      });

      await expect(
        service.getTaskById('task-1', 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getTaskById('task-1', 'user-1', 'org-1')
      ).rejects.toThrow('Task does not belong to your organization');
    });
  });

  describe('updateTask', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Title',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update task when user is creator', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockUsersService.getUserRoles.mockResolvedValue([Role.VIEWER]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.UPDATE_TASK]);
      mockTaskRepository.save.mockResolvedValue({
        ...mockTask,
        ...updateTaskDto,
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.updateTask('task-1', updateTaskDto, 'user-1', 'org-1');

      expect(result.title).toBe('Updated Title');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'UPDATE',
        'user-1',
        'org-1',
        'Task',
        'task-1',
        expect.any(Object)
      );
    });

    it('should update task when user is ADMIN (not creator)', async () => {
      const taskByOtherUser = { ...mockTask, createdBy: 'user-2' };
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockUsersService.getUserRoles.mockResolvedValue([Role.ADMIN]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.UPDATE_TASK]);
      mockTaskRepository.save.mockResolvedValue({
        ...taskByOtherUser,
        ...updateTaskDto,
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.updateTask('task-1', updateTaskDto, 'user-1', 'org-1');

      expect(result).toBeDefined();
    });

    it('should update task when user is OWNER (not creator)', async () => {
      const taskByOtherUser = { ...mockTask, createdBy: 'user-2' };
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockUsersService.getUserRoles.mockResolvedValue([Role.OWNER]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.UPDATE_TASK]);
      mockTaskRepository.save.mockResolvedValue({
        ...taskByOtherUser,
        ...updateTaskDto,
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.updateTask('task-1', updateTaskDto, 'user-1', 'org-1');

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when VIEWER tries to update others task', async () => {
      const taskByOtherUser = { ...mockTask, createdBy: 'user-2' };
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockUsersService.getUserRoles.mockResolvedValue([Role.VIEWER]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.UPDATE_TASK]);

      await expect(
        service.updateTask('task-1', updateTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateTask('task-1', updateTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow('You can only update tasks you created');
    });

    it('should throw NotFoundException when task not found', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTask('nonexistent', updateTaskDto, 'user-1', 'org-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTask', () => {
    it('should delete task when user is creator', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockUsersService.getUserRoles.mockResolvedValue([Role.ADMIN]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.DELETE_TASK]);
      mockTaskRepository.remove.mockResolvedValue(mockTask);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.deleteTask('task-1', 'user-1', 'org-1');

      expect(result.success).toBe(true);
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'DELETE',
        'user-1',
        'org-1',
        'Task',
        'task-1',
        expect.any(Object)
      );
    });

    it('should delete task when user is OWNER (not creator)', async () => {
      const taskByOtherUser = { ...mockTask, createdBy: 'user-2' };
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockUsersService.getUserRoles.mockResolvedValue([Role.OWNER]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.DELETE_TASK]);
      mockTaskRepository.remove.mockResolvedValue(taskByOtherUser);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.deleteTask('task-1', 'user-1', 'org-1');

      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when ADMIN tries to delete others task', async () => {
      const taskByOtherUser = { ...mockTask, createdBy: 'user-2' };
      
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockUsersService.getUserRoles.mockResolvedValue([Role.ADMIN]);
      mockUsersService.getUserPermissions.mockResolvedValue([Permission.DELETE_TASK]);

      await expect(
        service.deleteTask('task-1', 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteTask('task-1', 'user-1', 'org-1')
      ).rejects.toThrow('You can only delete tasks you created, unless you are an OWNER');
    });

    it('should throw ForbiddenException when user lacks DELETE_TASK permission', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockUsersService.getUserRoles.mockResolvedValue([Role.VIEWER]);
      mockUsersService.getUserPermissions.mockResolvedValue([]);

      await expect(
        service.deleteTask('task-1', 'user-1', 'org-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockUsersService.getById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteTask('nonexistent', 'user-1', 'org-1')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
