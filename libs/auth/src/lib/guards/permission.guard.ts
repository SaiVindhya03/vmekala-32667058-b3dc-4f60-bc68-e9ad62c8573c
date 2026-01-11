import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { JwtPayload } from '@vmekala/data';
import { userHasPermission } from '../role-hierarchy';

/**
 * Guard to check if the current user has one of the required permissions
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
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Check if user exists and has roles
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException(
        'Access denied: User does not have any roles'
      );
    }

    // Check if user has permissions in JWT payload (if available)
    if (user.permissions && user.permissions.length > 0) {
      const hasPermission = requiredPermissions.some((permission) =>
        user.permissions.includes(permission)
      );

      if (hasPermission) {
        return true;
      }
    }

    // Fallback: Check permissions based on role hierarchy
    const hasPermission = requiredPermissions.some((permission) =>
      userHasPermission(user.roles, permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: User must have one of the following permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
