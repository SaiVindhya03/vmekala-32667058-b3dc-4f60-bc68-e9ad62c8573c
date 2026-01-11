import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Permission } from '../entities/permission.entity';
import { UserDto } from '@vmekala/data';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Find user by ID with relations
   */
  async getById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async getByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  /**
   * Get user roles for a specific organization
   */
  async getUserRoles(userId: string, organizationId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: {
        userId,
        organizationId,
      },
      relations: ['role'],
    });

    return userRoles.map((ur) => ur.role.name);
  }

  /**
   * Get user permissions for a specific organization
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    // First, get the user's roles in the organization
    const userRoles = await this.userRoleRepository.find({
      where: {
        userId,
        organizationId,
      },
      relations: ['role'],
    });

    if (userRoles.length === 0) {
      return [];
    }

    // Get role IDs
    const roleIds = userRoles.map((ur) => ur.roleId);

    // Get all permissions for these roles
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.roleId IN (:...roleIds)', { roleIds })
      .getMany();

    // Return unique permission names
    const uniquePermissions = [...new Set(permissions.map((p) => p.name))];
    return uniquePermissions;
  }

  /**
   * Get all users in an organization
   */
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { organizationId },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  /**
   * Convert User entity to UserDto (exclude password)
   */
  toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
    };
  }

  /**
   * Convert multiple User entities to UserDto array
   */
  toDtoArray(users: User[]): UserDto[] {
    return users.map((user) => this.toDto(user));
  }
}
