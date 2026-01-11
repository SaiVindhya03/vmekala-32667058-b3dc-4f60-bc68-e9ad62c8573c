import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '@vmekala/auth';
import { PermissionGuard } from '@vmekala/auth';
import { RequirePermission } from '@vmekala/auth';
import { RequireRole } from '@vmekala/auth';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskService } from './task.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFiltersDto } from './dto/task-filters.dto';
import { TaskDto, JwtPayload } from '@vmekala/data';

/**
 * TaskController
 * 
 * Handles all task-related operations with comprehensive RBAC protection.
 * All endpoints are protected by:
 * - JwtAuthGuard: Verifies JWT token
 * - RoleGuard: Verifies role requirements if decorator present
 * - PermissionGuard: Verifies permission requirements if decorator present
 * 
 * OrganizationGuard is NOT applied at controller level because most endpoints
 * don't receive organizationId in request - they use the user's organizationId from JWT.
 * 
 * Error Handling:
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid JWT token
 * - 403 Forbidden: Insufficient permissions or role
 * - 404 Not Found: Resource not found
 */
@Controller('tasks')
@UseGuards(JwtAuthGuard, RoleGuard, PermissionGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * POST /tasks - Create a new task
   * 
   * Required Permission: CREATE_TASK
   * 
   * @param createTaskDto - Task creation data
   * @param user - Current authenticated user from JWT
   * @returns Created task
   * @throws BadRequestException if validation fails
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user lacks CREATE_TASK permission
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('CREATE_TASK')
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskDto> {
    try {
      // Validate user has organizationId
      if (!user.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Create task
      return await this.taskService.createTask(
        createTaskDto,
        user.userId,
        user.organizationId,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to create task',
      );
    }
  }

  /**
   * GET /tasks - List all tasks for user's organization
   * 
   * Optional filters via query parameters:
   * - status: Filter by task status (todo, in-progress, done)
   * - category: Filter by task category (e.g., Work, Personal)
   * 
   * @param filters - Optional query parameters for filtering
   * @param user - Current authenticated user from JWT
   * @returns Array of tasks
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user cannot access organization
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getTasks(
    @Query() filters: TaskFiltersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskDto[]> {
    try {
      // Validate user has organizationId
      if (!user.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Get tasks with optional filters
      return await this.taskService.getTasks(
        user.userId,
        user.organizationId,
        filters,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to retrieve tasks',
      );
    }
  }

  /**
   * GET /tasks/audit-log - View audit logs
   * 
   * Required Roles: OWNER or ADMIN
   * 
   * Query Parameters:
   * - limit: Maximum number of logs to return (default: 50, max: 100)
   * - offset: Number of logs to skip (default: 0)
   * 
   * @param limit - Maximum number of logs to return
   * @param offset - Number of logs to skip
   * @param user - Current authenticated user from JWT
   * @returns Array of audit logs
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is not OWNER or ADMIN
   */
  @Get('audit-log')
  @HttpCode(HttpStatus.OK)
  @RequireRole('OWNER', 'ADMIN')
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<AuditLogDto[]> {
    try {
      // Validate user has organizationId
      if (!user?.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Parse and validate limit
      const parsedLimit = limit ? parseInt(limit, 10) : 50;
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new BadRequestException('Limit must be a positive number');
      }
      if (parsedLimit > 100) {
        throw new BadRequestException('Limit cannot exceed 100');
      }

      // Parse and validate offset
      const parsedOffset = offset ? parseInt(offset, 10) : 0;
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        throw new BadRequestException('Offset must be a non-negative number');
      }

      // Get audit logs
      return await this.auditService.getAuditLogs(
        parsedLimit,
        parsedOffset,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to retrieve audit logs',
      );
    }
  }

  /**
   * GET /tasks/:id - Get a single task by ID
   * 
   * @param id - Task ID
   * @param user - Current authenticated user from JWT
   * @returns Task details
   * @throws NotFoundException if task not found
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if task belongs to different organization
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTaskById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskDto> {
    try {
      // Validate user has organizationId
      if (!user.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Validate ID format
      if (!id || id.trim() === '') {
        throw new BadRequestException('Task ID is required');
      }

      // Get task by ID
      return await this.taskService.getTaskById(
        id,
        user.userId,
        user.organizationId,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to retrieve task',
      );
    }
  }

  /**
   * PUT /tasks/:id - Update an existing task
   * 
   * Required Permission: UPDATE_TASK
   * Additional Rules:
   * - VIEWERs can only update their own tasks
   * - ADMINs and OWNERs can update any task in their organization
   * 
   * @param id - Task ID
   * @param updateTaskDto - Updated task data
   * @param user - Current authenticated user from JWT
   * @returns Updated task
   * @throws NotFoundException if task not found
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user lacks UPDATE_TASK permission or cannot update this task
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('UPDATE_TASK')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskDto> {
    try {
      // Validate user has organizationId
      if (!user.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Validate ID format
      if (!id || id.trim() === '') {
        throw new BadRequestException('Task ID is required');
      }

      // Validate update data has at least one field
      if (
        !updateTaskDto.title &&
        !updateTaskDto.description &&
        !updateTaskDto.status &&
        !updateTaskDto.category
      ) {
        throw new BadRequestException(
          'At least one field must be provided for update',
        );
      }

      // Update task
      return await this.taskService.updateTask(
        id,
        updateTaskDto,
        user.userId,
        user.organizationId,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to update task',
      );
    }
  }

  /**
   * DELETE /tasks/:id - Delete a task
   * 
   * Required Permission: DELETE_TASK
   * Additional Rules:
   * - VIEWERs and ADMINs can only delete their own tasks
   * - OWNERs can delete any task in their organization
   * 
   * @param id - Task ID
   * @param user - Current authenticated user from JWT
   * @returns Success response
   * @throws NotFoundException if task not found
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user lacks DELETE_TASK permission or cannot delete this task
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('DELETE_TASK')
  async deleteTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean }> {
    try {
      // Validate user has organizationId
      if (!user.organizationId) {
        throw new BadRequestException('User must belong to an organization');
      }

      // Validate ID format
      if (!id || id.trim() === '') {
        throw new BadRequestException('Task ID is required');
      }

      // Delete task
      return await this.taskService.deleteTask(
        id,
        user.userId,
        user.organizationId,
      );
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Wrap unknown errors
      throw new BadRequestException(
        error.message || 'Failed to delete task',
      );
    }
  }
}

/**
 * AuditLogDto - Data transfer object for audit log entries
 */
export interface AuditLogDto {
  id: string;
  action: string;
  userId: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  changes?: Record<string, unknown>;
}
