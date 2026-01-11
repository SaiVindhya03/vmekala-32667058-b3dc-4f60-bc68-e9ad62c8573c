import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

/**
 * EXAMPLES: Exception Handling in Controllers
 * 
 * This file demonstrates how to use the built-in HTTP exceptions
 * with the HttpExceptionFilter. All exceptions are automatically
 * caught and formatted into consistent JSON responses.
 */

interface ExampleUser {
  sub: string;
  username: string;
  organizationId: string;
  role: string;
}

@Controller('examples/error-handling')
export class ErrorHandlingExampleController {
  // Simulated in-memory data store for examples
  private mockTasks = [
    {
      id: '1',
      title: 'Example Task',
      description: 'This is a mock task',
      organizationId: 'org-1',
      createdBy: 'user-1',
      status: 'TODO',
      priority: 1,
      assignedTo: null as string | null,
    },
  ];

  /**
   * Example 1: NotFoundException (404)
   * 
   * GET /api/examples/error-handling/task/999
   * 
   * Response:
   * {
   *   "statusCode": 404,
   *   "message": "Task with ID 999 not found",
   *   "timestamp": "2026-01-09T18:30:00.000Z",
   *   "path": "/api/examples/error-handling/task/999"
   * }
   */
  @Get('task/:id')
  @UseGuards(JwtAuthGuard)
  getTaskExample(
    @Param('id') id: string,
    @CurrentUser() user: ExampleUser,
  ) {
    const task = this.mockTasks.find((t) => t.id === id);

    // Throw 404 if task doesn't exist
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Throw 403 if task belongs to different organization
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException(
        'Cannot access tasks from other organizations',
      );
    }

    return task;
  }

  /**
   * Example 2: BadRequestException (400)
   * 
   * POST /api/examples/error-handling/task
   * Body: { "title": "", "priority": 10 }
   * 
   * Response:
   * {
   *   "statusCode": 400,
   *   "message": "Title is required",
   *   "timestamp": "2026-01-09T18:30:00.000Z",
   *   "path": "/api/examples/error-handling/task"
   * }
   */
  @Post('task')
  @UseGuards(JwtAuthGuard)
  createTaskExample(
    @Body() body: { title?: string; priority?: number; dueDate?: string },
    @CurrentUser() user: ExampleUser,
  ) {
    // Validate required fields
    if (!body.title || body.title.trim() === '') {
      throw new BadRequestException('Title is required');
    }

    // Validate priority range
    if (body.priority !== undefined && (body.priority < 1 || body.priority > 5)) {
      throw new BadRequestException('Priority must be between 1 and 5');
    }

    // Validate due date
    if (body.dueDate && new Date(body.dueDate) < new Date()) {
      throw new BadRequestException('Due date cannot be in the past');
    }

    return {
      id: '2',
      title: body.title,
      priority: body.priority || 1,
      organizationId: user.organizationId,
      createdBy: user.sub,
      status: 'TODO',
    };
  }

  /**
   * Example 3: ForbiddenException (403)
   * 
   * DELETE /api/examples/error-handling/task/1
   * 
   * Response (when user is not admin and not task creator):
   * {
   *   "statusCode": 403,
   *   "message": "Only task creator or admin can delete this task",
   *   "timestamp": "2026-01-09T18:30:00.000Z",
   *   "path": "/api/examples/error-handling/task/1"
   * }
   */
  @Delete('task/:id')
  @UseGuards(JwtAuthGuard)
  deleteTaskExample(
    @Param('id') id: string,
    @CurrentUser() user: ExampleUser,
  ) {
    const task = this.mockTasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check organization access
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException(
        'Cannot delete tasks from other organizations',
      );
    }

    // Only admin or task creator can delete
    if (user.role !== 'admin' && task.createdBy !== user.sub) {
      throw new ForbiddenException(
        'Only task creator or admin can delete this task',
      );
    }

    // Delete logic would go here
    return { message: 'Task deleted successfully' };
  }

  /**
   * Example 4: UnauthorizedException (401)
   * 
   * This endpoint doesn't use JwtAuthGuard to demonstrate manual auth check.
   * In real apps, use guards instead.
   * 
   * GET /api/examples/error-handling/protected
   * Headers: Authorization: Bearer invalid-token
   * 
   * Response:
   * {
   *   "statusCode": 401,
   *   "message": "Invalid or expired authentication token",
   *   "timestamp": "2026-01-09T18:30:00.000Z",
   *   "path": "/api/examples/error-handling/protected"
   * }
   */
  @Get('protected')
  protectedExample(@CurrentUser() user?: ExampleUser) {
    // Manual auth check (normally done by guards)
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    return { message: 'Access granted', user: user.username };
  }

  /**
   * Example 5: Multiple Validation Checks
   * 
   * PUT /api/examples/error-handling/task/1
   * Body: { "status": "DONE", "priority": 0 }
   * 
   * Demonstrates chaining multiple validation checks with specific errors
   */
  @Put('task/:id')
  @UseGuards(JwtAuthGuard)
  updateTaskExample(
    @Param('id') id: string,
    @Body() body: { status?: string; priority?: number; assignedTo?: string },
    @CurrentUser() user: ExampleUser,
  ) {
    const task = this.mockTasks.find((t) => t.id === id);

    // Check 1: Existence
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check 2: Organization access
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied to this task');
    }

    // Check 3: Validate status
    if (body.status) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];
      if (!validStatuses.includes(body.status)) {
        throw new BadRequestException(
          `Status must be one of: ${validStatuses.join(', ')}`,
        );
      }

      // Business rule: Can't mark as done without assignee
      if (body.status === 'DONE' && !task.assignedTo && !body.assignedTo) {
        throw new BadRequestException(
          'Cannot mark task as done without an assignee',
        );
      }
    }

    // Check 4: Validate priority
    if (body.priority !== undefined && (body.priority < 1 || body.priority > 5)) {
      throw new BadRequestException('Priority must be between 1 and 5');
    }

    return { ...task, ...body };
  }

  /**
   * Example 6: Complex Permission Check
   * 
   * POST /api/examples/error-handling/task/1/assign
   * Body: { "userId": "user-2" }
   * 
   * Demonstrates complex permission logic
   */
  @Post('task/:id/assign')
  @UseGuards(JwtAuthGuard)
  assignTaskExample(
    @Param('id') id: string,
    @Body() body: { userId?: string },
    @CurrentUser() user: ExampleUser,
  ) {
    const task = this.mockTasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }

    // Only project managers and admins can assign tasks
    const canAssign = ['admin', 'project_manager'].includes(user.role);
    if (!canAssign) {
      throw new ForbiddenException(
        'Only project managers and admins can assign tasks',
      );
    }

    // Can't assign archived tasks
    if (task.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot assign archived tasks');
    }

    return { ...task, assignedTo: body.userId };
  }

  /**
   * Example 7: Bulk Operation with Partial Errors
   * 
   * POST /api/examples/error-handling/tasks/bulk-delete
   * Body: { "taskIds": ["1", "2", "999"] }
   * 
   * Note: In real apps, you might want to handle partial failures differently.
   * This example throws on first error for simplicity.
   */
  @Post('tasks/bulk-delete')
  @UseGuards(JwtAuthGuard)
  bulkDeleteExample(
    @Body() body: { taskIds?: string[] },
    @CurrentUser() user: ExampleUser,
  ) {
    if (!body.taskIds || !Array.isArray(body.taskIds)) {
      throw new BadRequestException('taskIds must be an array');
    }

    if (body.taskIds.length === 0) {
      throw new BadRequestException('taskIds array cannot be empty');
    }

    if (body.taskIds.length > 100) {
      throw new BadRequestException('Cannot delete more than 100 tasks at once');
    }

    // Validate all tasks exist before deletion
    const notFound = body.taskIds.filter(
      (id) => !this.mockTasks.find((t) => t.id === id),
    );
    if (notFound.length > 0) {
      throw new NotFoundException(
        `Tasks not found: ${notFound.join(', ')}`,
      );
    }

    // Check permissions for each task
    const forbidden = body.taskIds.filter((id) => {
      const task = this.mockTasks.find((t) => t.id === id);
      return (
        task &&
        task.organizationId !== user.organizationId
      );
    });
    if (forbidden.length > 0) {
      throw new ForbiddenException(
        `Cannot delete tasks from other organizations: ${forbidden.join(', ')}`,
      );
    }

    return {
      message: `Successfully deleted ${body.taskIds.length} tasks`,
      deletedIds: body.taskIds,
    };
  }
}
