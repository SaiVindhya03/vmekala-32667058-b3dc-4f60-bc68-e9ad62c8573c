import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtPayload } from '@vmekala/data';

/**
 * Guard to ensure users can only access resources from their own organization
 * 
 * This guard checks that the organizationId from the JWT token matches
 * the organizationId in the request parameters, body, or query.
 * 
 * @example
 * ```typescript
 * @Get(':organizationId/tasks')
 * @UseGuards(JwtAuthGuard, OrganizationGuard)
 * getTasks(@Param('organizationId') organizationId: string) {
 *   return this.tasksService.findByOrganization(organizationId);
 * }
 * 
 * @Post('tasks')
 * @UseGuards(JwtAuthGuard, OrganizationGuard)
 * createTask(@Body() createTaskDto: CreateTaskDto) {
 *   // Body must contain organizationId matching user's organization
 *   return this.tasksService.create(createTaskDto);
 * }
 * ```
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Check if user exists and has organizationId
    if (!user || !user.organizationId) {
      throw new ForbiddenException(
        'Access denied: User does not belong to an organization'
      );
    }

    // Extract organizationId from various sources
    const resourceOrganizationId =
      request.params?.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    // If no organizationId is found in the request, throw error
    if (!resourceOrganizationId) {
      throw new BadRequestException(
        'organizationId is required in request parameters, body, or query'
      );
    }

    // Check if user's organizationId matches the resource's organizationId
    if (user.organizationId !== resourceOrganizationId) {
      throw new ForbiddenException(
        'Access denied: You can only access resources from your own organization'
      );
    }

    return true;
  }
}
