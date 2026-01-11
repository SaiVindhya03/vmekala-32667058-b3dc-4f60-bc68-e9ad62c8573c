import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '@vmekala/auth';
import { RoleGuard } from '@vmekala/auth';
import { RequireRole } from '@vmekala/auth';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload, UserDto, Role } from '@vmekala/data';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/profile
   * Get current authenticated user's profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<UserDto> {
    const userEntity = await this.usersService.getById(user.userId);
    return this.usersService.toDto(userEntity);
  }

  /**
   * GET /users/:id
   * Get user by ID (must be in same organization)
   */
  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<UserDto> {
    // Get the requested user
    const userEntity = await this.usersService.getById(id);
    
    // Verify the user belongs to the same organization
    if (userEntity.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied: User is not in your organization');
    }
    
    return this.usersService.toDto(userEntity);
  }

  /**
   * GET /users/organization/:organizationId
   * List all users in an organization (OWNER/ADMIN only)
   */
  @Get('organization/:organizationId')
  @UseGuards(OrganizationGuard, RoleGuard)
  @RequireRole(Role.OWNER, Role.ADMIN)
  async getUsersByOrganization(
    @Param('organizationId') organizationId: string
  ): Promise<UserDto[]> {
    const users = await this.usersService.getUsersByOrganization(organizationId);
    return this.usersService.toDtoArray(users);
  }
}
