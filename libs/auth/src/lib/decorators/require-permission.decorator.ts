import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for required permissions
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * 
 * @example
 * ```typescript
 * @Post('tasks')
 * @UseGuards(JwtAuthGuard, PermissionGuard)
 * @RequirePermission('CREATE_TASK')
 * createTask() {
 *   return 'Task created';
 * }
 * ```
 * 
 * @param permissions - One or more permissions required to access the route
 * @returns Metadata decorator
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
