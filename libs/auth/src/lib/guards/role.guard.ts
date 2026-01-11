import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-role.decorator';
import { JwtPayload } from '@vmekala/data';

/**
 * Guard to check if the current user has one of the required roles
 * 
 * @example
 * ```typescript
 * @Get('admin')
 * @UseGuards(JwtAuthGuard, RoleGuard)
 * @RequireRole('OWNER', 'ADMIN')
 * adminOnly() {
 *   return 'This is admin only';
 * }
 * ```
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
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

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: User must have one of the following roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
