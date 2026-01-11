import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
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
 * 
 * @param roles - One or more roles required to access the route
 * @returns Metadata decorator
 */
export const RequireRole = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
