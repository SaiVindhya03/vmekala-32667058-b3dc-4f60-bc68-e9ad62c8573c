import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Permission } from '../entities/permission.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let userRoleRepository: Repository<UserRole>;
  let permissionRepository: Repository<Permission>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 'org-1',
    createdAt: new Date(),
    organization: { id: 'org-1', name: 'Test Org' },
    userRoles: [
      {
        role: { id: 'role-1', name: 'ADMIN' },
      },
    ],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRoleRepository = {
    find: jest.fn(),
  };

  const mockPermissionRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userRoleRepository = module.get<Repository<UserRole>>(
      getRepositoryToken(UserRole)
    );
    permissionRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission)
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: ['organization', 'userRoles', 'userRoles.role'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getById('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found'
      );
    });
  });

  describe('getByEmail', () => {
    it('should return user when found by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles for organization', async () => {
      const mockUserRoles = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          role: { id: 'role-1', name: 'ADMIN' },
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          role: { id: 'role-2', name: 'VIEWER' },
        },
      ];

      mockUserRoleRepository.find.mockResolvedValue(mockUserRoles);

      const result = await service.getUserRoles('user-1', 'org-1');

      expect(result).toEqual(['ADMIN', 'VIEWER']);
      expect(mockUserRoleRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: 'org-1' },
        relations: ['role'],
      });
    });

    it('should return empty array when user has no roles', async () => {
      mockUserRoleRepository.find.mockResolvedValue([]);

      const result = await service.getUserRoles('user-1', 'org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions for organization', async () => {
      const mockUserRoles = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          roleId: 'role-1',
          role: { id: 'role-1', name: 'ADMIN' },
        },
      ];

      const mockPermissions = [
        { id: 'perm-1', name: 'CREATE_TASK', roleId: 'role-1' },
        { id: 'perm-2', name: 'READ_TASK', roleId: 'role-1' },
        { id: 'perm-3', name: 'UPDATE_TASK', roleId: 'role-1' },
      ];

      mockUserRoleRepository.find.mockResolvedValue(mockUserRoles);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissions),
      };
      mockPermissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserPermissions('user-1', 'org-1');

      expect(result).toEqual(['CREATE_TASK', 'READ_TASK', 'UPDATE_TASK']);
    });

    it('should return empty array when user has no roles', async () => {
      mockUserRoleRepository.find.mockResolvedValue([]);

      const result = await service.getUserPermissions('user-1', 'org-1');

      expect(result).toEqual([]);
    });

    it('should return unique permissions when multiple roles have same permission', async () => {
      const mockUserRoles = [
        {
          userId: 'user-1',
          organizationId: 'org-1',
          roleId: 'role-1',
          role: { id: 'role-1', name: 'ADMIN' },
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          roleId: 'role-2',
          role: { id: 'role-2', name: 'VIEWER' },
        },
      ];

      const mockPermissions = [
        { id: 'perm-1', name: 'READ_TASK', roleId: 'role-1' },
        { id: 'perm-2', name: 'CREATE_TASK', roleId: 'role-1' },
        { id: 'perm-3', name: 'READ_TASK', roleId: 'role-2' }, // Duplicate
      ];

      mockUserRoleRepository.find.mockResolvedValue(mockUserRoles);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissions),
      };
      mockPermissionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserPermissions('user-1', 'org-1');

      expect(result).toEqual(['READ_TASK', 'CREATE_TASK']);
      expect(result.length).toBe(2); // Should only have unique permissions
    });
  });

  describe('getUsersByOrganization', () => {
    it('should return all users in organization', async () => {
      const mockUsers = [
        mockUser,
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
          organizationId: 'org-1',
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUsersByOrganization('org-1');

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        relations: ['userRoles', 'userRoles.role'],
      });
    });

    it('should return empty array when no users in organization', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getUsersByOrganization('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('toDto', () => {
    it('should convert user entity to DTO without password', () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashedpassword123',
      };

      const result = service.toDto(userWithPassword as any);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        organizationId: mockUser.organizationId,
        createdAt: mockUser.createdAt,
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('toDtoArray', () => {
    it('should convert multiple users to DTOs', () => {
      const users = [
        mockUser,
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
          organizationId: 'org-1',
          createdAt: new Date(),
        },
      ];

      const result = service.toDtoArray(users as any);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });

    it('should return empty array for empty input', () => {
      const result = service.toDtoArray([]);

      expect(result).toEqual([]);
    });
  });
});
