import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskDto, TaskStatus, Permission, Role } from '@vmekala/data';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFiltersDto } from './dto/task-filters.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new task with RBAC checks
   */
  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
    organizationId: string,
  ): Promise<TaskDto> {
    // RBAC Check 1: Verify user belongs to the organization
    const user = await this.usersService.getById(userId);
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'User does not belong to the specified organization',
      );
    }

    // RBAC Check 2: Verify user has CREATE_TASK permission
    const permissions = await this.usersService.getUserPermissions(
      userId,
      organizationId,
    );
    if (!permissions.includes(Permission.CREATE_TASK)) {
      throw new ForbiddenException(
        'User does not have CREATE_TASK permission',
      );
    }

    // Create task with validated data
    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || TaskStatus.TODO,
      category: createTaskDto.category || 'Work',
      organizationId,
      createdBy: userId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log action to audit log
    await this.auditService.log(
      'CREATE',
      userId,
      organizationId,
      'Task',
      savedTask.id,
      {
        title: savedTask.title,
        description: savedTask.description,
        status: savedTask.status,
        category: savedTask.category,
      },
    );

    return this.toDto(savedTask);
  }

  /**
   * Get all tasks for a user's organization with optional filters
   */
  async getTasks(
    userId: string,
    organizationId: string,
    filters?: TaskFiltersDto,
  ): Promise<TaskDto[]> {
    // RBAC Check 1: Verify user belongs to the organization
    const user = await this.usersService.getById(userId);
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'User does not belong to the specified organization',
      );
    }

    // RBAC Check 2: All users can read tasks (VIEWER, ADMIN, OWNER all have READ_TASK)
    // This is implicit - if user is in organization, they can view tasks
    const permissions = await this.usersService.getUserPermissions(
      userId,
      organizationId,
    );
    if (!permissions.includes(Permission.READ_TASK)) {
      throw new ForbiddenException(
        'User does not have READ_TASK permission',
      );
    }

    // Build query to return ONLY tasks from user's organization
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.organizationId = :organizationId', { organizationId });

    // Apply filters if provided
    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      queryBuilder.andWhere('task.category = :category', {
        category: filters.category,
      });
    }

    queryBuilder.orderBy('task.createdAt', 'DESC');

    const tasks = await queryBuilder.getMany();

    return tasks.map((task) => this.toDto(task));
  }

  /**
   * Get a single task by ID with RBAC checks
   */
  async getTaskById(
    taskId: string,
    userId: string,
    organizationId: string,
  ): Promise<TaskDto> {
    // RBAC Check 1: Verify user belongs to the organization
    const user = await this.usersService.getById(userId);
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'User does not belong to the specified organization',
      );
    }

    // RBAC Check 2: Verify user has READ_TASK permission
    const permissions = await this.usersService.getUserPermissions(
      userId,
      organizationId,
    );
    if (!permissions.includes(Permission.READ_TASK)) {
      throw new ForbiddenException(
        'User does not have READ_TASK permission',
      );
    }

    // Fetch task
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // RBAC Check 3: Verify organizationId matches user's organization
    if (task.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Task does not belong to your organization',
      );
    }

    // Log READ action to audit log
    await this.auditService.log(
      'READ',
      userId,
      organizationId,
      'Task',
      taskId,
    );

    return this.toDto(task);
  }

  /**
   * Update a task with RBAC checks
   */
  async updateTask(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    organizationId: string,
  ): Promise<TaskDto> {
    // RBAC Check 1: Verify user belongs to the organization
    const user = await this.usersService.getById(userId);
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'User does not belong to the specified organization',
      );
    }

    // Fetch task
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // RBAC Check 2: Verify organizationId matches user's organization
    if (task.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Task does not belong to your organization',
      );
    }

    // RBAC Check 3: Get user roles and permissions
    const roles = await this.usersService.getUserRoles(userId, organizationId);
    const permissions = await this.usersService.getUserPermissions(
      userId,
      organizationId,
    );

    // RBAC Check 4: Verify user has UPDATE_TASK permission
    if (!permissions.includes(Permission.UPDATE_TASK)) {
      throw new ForbiddenException(
        'User does not have UPDATE_TASK permission',
      );
    }

    // RBAC Check 5: Verify user created the task OR is ADMIN/OWNER
    const isCreator = task.createdBy === userId;
    const isAdminOrOwner =
      roles.includes(Role.ADMIN) || roles.includes(Role.OWNER);

    if (!isCreator && !isAdminOrOwner) {
      throw new ForbiddenException(
        'You can only update tasks you created, unless you are an ADMIN or OWNER',
      );
    }

    // Track changes for audit log
    const changes: Record<string, { old: any; new: any }> = {};

    if (updateTaskDto.title !== undefined && updateTaskDto.title !== task.title) {
      changes.title = { old: task.title, new: updateTaskDto.title };
      task.title = updateTaskDto.title;
    }

    if (updateTaskDto.description !== undefined && updateTaskDto.description !== task.description) {
      changes.description = { old: task.description, new: updateTaskDto.description };
      task.description = updateTaskDto.description;
    }

    if (updateTaskDto.status !== undefined && updateTaskDto.status !== task.status) {
      changes.status = { old: task.status, new: updateTaskDto.status };
      task.status = updateTaskDto.status;
    }

    if (updateTaskDto.category !== undefined && updateTaskDto.category !== task.category) {
      changes.category = { old: task.category, new: updateTaskDto.category };
      task.category = updateTaskDto.category;
    }

    // Save updated task
    const updatedTask = await this.taskRepository.save(task);

    // Log UPDATE action with changes
    await this.auditService.log(
      'UPDATE',
      userId,
      organizationId,
      'Task',
      taskId,
      changes,
    );

    return this.toDto(updatedTask);
  }

  /**
   * Delete a task with RBAC checks
   */
  async deleteTask(
    taskId: string,
    userId: string,
    organizationId: string,
  ): Promise<{ success: boolean }> {
    // RBAC Check 1: Verify user belongs to the organization
    const user = await this.usersService.getById(userId);
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'User does not belong to the specified organization',
      );
    }

    // Fetch task
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // RBAC Check 2: Verify organizationId matches user's organization
    if (task.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Task does not belong to your organization',
      );
    }

    // RBAC Check 3: Get user roles and permissions
    const roles = await this.usersService.getUserRoles(userId, organizationId);
    const permissions = await this.usersService.getUserPermissions(
      userId,
      organizationId,
    );

    // RBAC Check 4: Verify user has DELETE_TASK permission
    if (!permissions.includes(Permission.DELETE_TASK)) {
      throw new ForbiddenException(
        'User does not have DELETE_TASK permission',
      );
    }

    // RBAC Check 5: Verify user created the task OR is OWNER
    const isCreator = task.createdBy === userId;
    const isOwner = roles.includes(Role.OWNER);

    if (!isCreator && !isOwner) {
      throw new ForbiddenException(
        'You can only delete tasks you created, unless you are an OWNER',
      );
    }

    // Delete task
    await this.taskRepository.remove(task);

    // Log DELETE action
    await this.auditService.log(
      'DELETE',
      userId,
      organizationId,
      'Task',
      taskId,
      {
        deletedTask: {
          title: task.title,
          description: task.description,
          status: task.status,
          category: task.category,
        },
      },
    );

    return { success: true };
  }

  /**
   * Convert Task entity to TaskDto
   */
  private toDto(task: Task): TaskDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      category: task.category,
      organizationId: task.organizationId,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
